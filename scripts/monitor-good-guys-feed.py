"""Check every approved Good Guys offer without following affiliate redirects."""
import argparse
import csv
import json
import os
import re
import sys
import urllib.error
import urllib.request
from decimal import Decimal, InvalidOperation
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
MAX_BYTES = 100_000_000


def destination(link):
    """Decode only; this function never makes network requests."""
    url = urlsplit(link)
    if url.scheme != 'https' or url.hostname != 'prf.hn' or url.username or url.password or url.port or url.query or url.fragment:
        raise ValueError('Invalid Partnerize tracking structure')
    match = re.fullmatch(r'/click/camref:([^/]+)/(?:creativeref:[^/]+/)?destination:(.+)', url.path)
    if not match:
        raise ValueError('Missing explicit affiliate destination')
    target = urlsplit(unquote(match[2]))
    if target.scheme != 'https' or target.hostname != 'www.thegoodguys.com.au' or target.username or target.password or target.port or target.query or target.fragment:
        raise ValueError('Invalid Good Guys product destination')
    if not re.fullmatch(r'/[a-z0-9]+(?:-[a-z0-9]+)+/?', target.path):
        raise ValueError('Expected an exact Good Guys product path')
    return 'https://www.thegoodguys.com.au' + target.path.rstrip('/'), match[1]


def selected_offers(catalogue):
    campaign = catalogue['affiliatePrograms']['partnerize']['trackingValue']
    selected = {}
    for product in catalogue['products']:
        if product.get('editorialStatus') != 'approved':
            continue
        for offer in [product, *product.get('additionalRetailers', [])]:
            if offer.get('merchant') != 'The Good Guys' or offer.get('affiliateNetwork') != 'partnerize' or not offer.get('approvedForAffiliateUse') or not offer.get('affiliate'):
                continue
            target, actual = destination(offer['destinationUrl'])
            if actual != campaign:
                raise ValueError('Approved catalogue offer has an unexpected campaign')
            entry = selected.setdefault(target, {'productIds': [], 'guides': [], 'name': product['name']})
            if product['id'] not in entry['productIds']:
                entry['productIds'].append(product['id'])
            if product['guidePath'] not in entry['guides']:
                entry['guides'].append(product['guidePath'])
    if not selected:
        raise ValueError('No approved Good Guys offers selected; refusing an empty check')
    return selected, campaign


def feed_file(local_path):
    if local_path:
        return Path(local_path)
    url = os.environ.get('GOOD_GUYS_FEED_URL', '')
    if urlsplit(url).scheme != 'https':
        raise ValueError('GOOD_GUYS_FEED_URL must be an HTTPS feed location')
    request = urllib.request.Request(url, headers={'User-Agent': 'AHC-Partnerize-Feed-Monitor/2.0'})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError('Feed exceeds the 100 MB safety limit')
    from tempfile import NamedTemporaryFile
    with NamedTemporaryFile(delete=False, suffix='.csv') as output:
        output.write(data)
        return Path(output.name)


def safe_text(value):
    return re.sub(r'https?://\S+', '[link omitted]', str(value)).replace('\n', ' ').replace('\r', ' ').replace('::', ':')[:250]


def run(source, previous, state_path, catalogue=None, report_path=None):
    catalogue = catalogue or json.loads((ROOT / 'src/data/commercial-products.json').read_text(encoding='utf-8'))
    selected, campaign = selected_offers(catalogue)
    found = {}
    with source.open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle, delimiter='|')
        needed = {'SKU/Unique Identifier', 'Price', 'Stock', 'URL', 'Currency', 'Title'}
        if not needed.issubset(reader.fieldnames or []):
            raise ValueError('Feed is missing required product fields')
        for row in reader:
            try:
                target, feed_campaign = destination(row['URL'])
            except (ValueError, TypeError):
                continue
            if target not in selected:
                continue
            if target in found:
                found[target] = {'status': 'invalid', 'reason': 'Duplicate destination in feed'}
                continue
            try:
                price = Decimal(row['Price'])
                valid_price = price.is_finite() and price > 0
            except (InvalidOperation, TypeError):
                valid_price = False
            if feed_campaign != campaign or row['Currency'] != 'AUD' or row['Stock'] not in {'Yes', 'No'} or not valid_price or not row['SKU/Unique Identifier'] or not row['Title']:
                found[target] = {'status': 'invalid', 'reason': 'Campaign, identity, currency, price or stock field failed validation'}
                continue
            found[target] = {'status': 'ok', 'sku': safe_text(row['SKU/Unique Identifier']), 'price': str(price), 'stock': row['Stock'], 'title': safe_text(row['Title'])}
    prior_state = json.loads(previous.read_text(encoding='utf-8')) if previous.exists() else {}
    old = prior_state.get('products', {}) if prior_state.get('version') == 2 else {}
    legacy = prior_state if 'version' not in prior_state else {}
    lines = ['## The Good Guys feed check', '', f'Checked {len(selected)} distinct approved offers, including additional retailer buttons and repeated article placements.', '', 'Feed values are observations, not live site prices. No affiliate destinations requested.', '']
    products, faults, changes = {}, [], []
    for target, entry in selected.items():
        current = found.get(target, {'status': 'missing', 'reason': 'No matching product destination in feed'})
        prior = old.get(target) or legacy.get(current.get('sku'))
        products[target] = current
        # A missing/invalid row must not erase the last reviewed identity.
        if current['status'] != 'ok' and prior:
            products[target] = {**current, **{field: prior[field] for field in ('title', 'sku') if field in prior}}
        label = safe_text(entry['name'])
        changed_fields = [field for field in ('status', 'sku', 'price', 'stock', 'title') if prior is not None and field in prior and prior.get(field) != current.get(field)]
        if current['status'] != 'ok' or current.get('stock') == 'No':
            reason = current.get('reason', 'Feed flags out of stock')
            faults.append({'name': entry['name'], 'guides': entry['guides'], 'reason': reason})
            lines.append(f'- **Review required:** {label}: {reason}.')
        elif changed_fields:
            changes.append({'name': entry['name'], 'fields': changed_fields})
            detail = '; '.join(f'{field} {safe_text(prior.get(field))} → {safe_text(current.get(field))}' for field in changed_fields)
            lines.append(f'- {label}: {detail}.')
            if any(field in changed_fields for field in ('title', 'sku')):
                faults.append({'name': entry['name'], 'guides': entry['guides'], 'reason': 'Feed identity changed; review exact model'})
                # Keep the approved identity until review; a second run must not silently clear it.
                products[target] = {**current, **{field: prior[field] for field in ('title', 'sku') if field in prior}}
        else:
            lines.append(f'- {label}: {safe_text(current.get("sku", ""))}; '+('baseline recorded.' if prior is None else 'no change.'))
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps({'version': 2, 'products': products}, indent=2)+'\n', encoding='utf-8')
    summary = '\n'.join(lines) + f'\n\n{len(selected)} offers checked; {len(faults)} require review. Price-only changes do not fail the monitor.\n'
    print(summary)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'], 'a', encoding='utf-8') as output:
            output.write(summary)
    if report_path:
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(json.dumps({'selectedOffers': len(selected), 'matchedOffers': len(found), 'faults': faults, 'changes': changes}, indent=2)+'\n', encoding='utf-8')
    return 1 if faults else 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--feed', help='Local feed CSV for fixture/manual checks')
    parser.add_argument('--previous', default='.feed-monitor/previous.json')
    parser.add_argument('--state', default='.feed-monitor/current.json')
    parser.add_argument('--report', default='.feed-monitor/report.json')
    args = parser.parse_args()
    source = None
    try:
        source = feed_file(args.feed)
        return run(source, Path(args.previous), Path(args.state), report_path=Path(args.report))
    except urllib.error.URLError:
        print('Good Guys feed check failed: feed download unavailable', file=sys.stderr)
        return 1
    except (OSError, ValueError, csv.Error, KeyError, TypeError):
        print('Good Guys feed check failed: invalid configuration, state or feed data', file=sys.stderr)
        return 1
    finally:
        if not args.feed and source:
            source.unlink(missing_ok=True)


if __name__ == '__main__':
    sys.exit(main())
