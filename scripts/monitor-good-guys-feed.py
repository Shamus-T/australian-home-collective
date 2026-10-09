"""Review selected Good Guys products in the Partnerize feed without publishing prices."""

import argparse
import csv
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PRODUCTS = {"roborock-qrevo-edge-c-good-guys": "RR-QREC02-03-WHT"}
MAX_BYTES = 100_000_000


def feed_file(local_path):
    if local_path:
        return Path(local_path)
    url = os.environ.get("GOOD_GUYS_FEED_URL", "")
    if urlsplit(url).scheme != "https":
        raise ValueError("GOOD_GUYS_FEED_URL must be an HTTPS feed location")
    request = urllib.request.Request(url, headers={"User-Agent": "AHC-Partnerize-Feed-Monitor/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        data = response.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError("Feed exceeds the 100 MB safety limit")
    from tempfile import NamedTemporaryFile

    with NamedTemporaryFile(delete=False, suffix=".csv") as output:
        output.write(data)
        return Path(output.name)


def run(source, previous, state_path):
    catalogue = json.loads((ROOT / "src/data/commercial-products.json").read_text())
    selected = {}
    for product in catalogue["products"]:
        if product["id"] not in PRODUCTS:
            continue
        if product["affiliateNetwork"] != "partnerize" or product["merchant"] != "The Good Guys":
            raise ValueError(f"{product['id']} is no longer a Good Guys Partnerize product")
        selected[PRODUCTS[product["id"]]] = product
    if len(selected) != len(PRODUCTS):
        raise ValueError("The curated Good Guys product mapping is incomplete")

    found = {}
    with source.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle, delimiter="|")
        needed = {"SKU/Unique Identifier", "Price", "Stock", "URL", "Currency", "Title"}
        if not needed.issubset(reader.fieldnames or []):
            raise ValueError("Feed is missing required product fields")
        for row in reader:
            sku = row["SKU/Unique Identifier"]
            if sku not in selected:
                continue
            if sku in found:
                raise ValueError(f"Duplicate feed SKU: {sku}")
            link = row["URL"]
            expected = selected[sku]["destinationUrl"]
            if link != expected or urlsplit(link).hostname != "prf.hn":
                raise ValueError(f"Tracking link changed for {sku}; review before publishing")
            destination = unquote(link.split("/destination:", 1)[-1])
            if not destination.startswith("https://www.thegoodguys.com.au/") or sku.lower() not in destination.lower():
                raise ValueError(f"Unexpected product destination for {sku}")
            if row["Currency"] != "AUD" or row["Stock"] not in {"Yes", "No"}:
                raise ValueError(f"Invalid currency or stock flag for {sku}")
            price = row["Price"]
            try:
                if float(price) <= 0:
                    raise ValueError()
            except ValueError:
                raise ValueError(f"Invalid price for {sku}") from None
            found[sku] = {"price": price, "stock": row["Stock"], "title": row["Title"]}

    old = json.loads(previous.read_text()) if previous.exists() else {}
    lines = ["## The Good Guys feed check", "", "Feed values are observations, not live site prices.", ""]
    failures = []
    changed = False
    for sku in selected:
        current = found.get(sku)
        if not current:
            lines.append(f"- {sku}: missing from feed; review the site card.")
            failures.append(sku)
            continue
        prior = old.get(sku)
        changes = [] if prior is None else [
            f"{field} {prior[field]} → {current[field]}"
            for field in ("price", "stock", "title") if prior.get(field) != current[field]
        ]
        changed = changed or bool(changes)
        lines.append(f"- {sku}: " + ("; ".join(changes) if changes else "no change or first check"))
        if current["stock"] == "No":
            lines.append("  - Feed flags this item out of stock; review the published card.")
            failures.append(sku)
    summary = "\n".join(lines) + "\n"
    print(summary)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as output:
            output.write(summary)
    if failures:
        return 1
    state_path.parent.mkdir(parents=True, exist_ok=True)
    state_path.write_text(json.dumps(found, indent=2) + "\n")
    return 1 if changed else 0


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--feed", help="Local feed CSV, for manual checks")
    parser.add_argument("--previous", default=".feed-monitor/previous.json")
    parser.add_argument("--state", default=".feed-monitor/current.json")
    args = parser.parse_args()
    downloaded = not args.feed
    source = None
    try:
        source = feed_file(args.feed)
        return run(source, Path(args.previous), Path(args.state))
    except urllib.error.URLError:
        print("Good Guys feed check failed: feed download unavailable", file=sys.stderr)
        return 1
    except (OSError, ValueError, csv.Error, json.JSONDecodeError) as error:
        print(f"Good Guys feed check failed: {error}", file=sys.stderr)
        return 1
    finally:
        if downloaded and source:
            source.unlink(missing_ok=True)


if __name__ == "__main__":
    sys.exit(main())
