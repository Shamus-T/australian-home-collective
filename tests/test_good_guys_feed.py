import contextlib
import csv
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('monitor', Path(__file__).resolve().parents[1]/'scripts/monitor-good-guys-feed.py')
monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor)


def offer(slug='example-model', campaign='approved'):
    return {'merchant': 'The Good Guys', 'affiliateNetwork': 'partnerize', 'affiliate': True, 'approvedForAffiliateUse': True, 'destinationUrl': f'https://prf.hn/click/camref:{campaign}/creativeref:creative/destination:https%3A%2F%2Fwww.thegoodguys.com.au%2F{slug}'}


def catalogue():
    return {'affiliatePrograms': {'partnerize': {'trackingValue': 'approved'}}, 'products': [
        dict(offer(), id='one', name='Example model', guidePath='/guides/one/', editorialStatus='approved'),
        dict(offer(), id='repeat', name='Example model', guidePath='/guides/two/', editorialStatus='approved'),
        {'id': 'amazon', 'name': 'Second model', 'guidePath': '/guides/one/', 'editorialStatus': 'approved', 'additionalRetailers': [offer('second-model')]},
        dict(offer('paused-model'), id='paused', name='Paused', guidePath='/guides/one/', editorialStatus='paused')
    ]}


def row(slug='example-model', **changes):
    return {'SKU/Unique Identifier': slug, 'Title': slug, 'Price': '100.00', 'Stock': 'Yes', 'Currency': 'AUD', 'URL': offer(slug)['destinationUrl'], **changes}


class FeedMonitorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.previous = self.root/'previous.json'
        self.state = self.root/'current.json'

    def run_feed(self, rows):
        feed = self.root/'feed.csv'
        with feed.open('w', newline='', encoding='utf-8') as handle:
            writer = csv.DictWriter(handle, fieldnames=list(row()), delimiter='|')
            writer.writeheader(); writer.writerows(rows)
        with contextlib.redirect_stdout(io.StringIO()):
            return monitor.run(feed, self.previous, self.state, catalogue())

    def test_selection_includes_additional_offers_and_deduplicates(self):
        selected, _ = monitor.selected_offers(catalogue())
        self.assertEqual(len(selected), 2)
        self.assertEqual(len(next(iter(selected.values()))['guides']), 2)

    def test_price_change_is_reported_without_failure(self):
        self.assertEqual(self.run_feed([row(), row('second-model')]), 0)
        self.previous.write_text(self.state.read_text())
        self.assertEqual(self.run_feed([row(Price='90.00'), row('second-model')]), 0)

    def test_missing_out_of_stock_and_recovery_persist_state(self):
        self.assertEqual(self.run_feed([row(Stock='No')]), 1)
        self.assertTrue(self.state.exists())
        self.previous.write_text(self.state.read_text())
        self.assertEqual(self.run_feed([row(), row('second-model')]), 0)

    def test_bad_campaign_non_finite_price_duplicate_and_identity_change(self):
        for bad in [row(URL=offer(campaign='wrong')['destinationUrl']), row(Price='NaN'), row(Price='Infinity')]:
            self.assertEqual(self.run_feed([bad, row('second-model')]), 1)
        self.assertEqual(self.run_feed([row(), row(), row('second-model')]), 1)
        self.run_feed([row(), row('second-model')])
        self.previous.write_text(self.state.read_text())
        self.assertEqual(self.run_feed([row(Title='Different appliance'), row('second-model')]), 1)
        self.previous.write_text(self.state.read_text())
        self.assertEqual(self.run_feed([row(Title='Different appliance'), row('second-model')]), 1)

    def test_legacy_sku_state_migrates(self):
        self.previous.write_text(json.dumps({'example-model': {'price': '100.00', 'stock': 'Yes', 'title': 'example-model'}}))
        self.assertEqual(self.run_feed([row(), row('second-model')]), 0)
        self.assertEqual(json.loads(self.state.read_text())['version'], 2)

    def test_missing_row_does_not_reset_identity_baseline(self):
        self.assertEqual(self.run_feed([row(), row('second-model')]), 0)
        self.previous.write_text(self.state.read_text())
        self.assertEqual(self.run_feed([row('second-model')]), 1)
        self.previous.write_text(self.state.read_text())
        self.assertEqual(self.run_feed([row(Title='Different appliance'), row('second-model')]), 1)

    def test_rejects_empty_selection_and_unapproved_destinations(self):
        c = catalogue(); c['products'] = []
        with self.assertRaises(ValueError): monitor.selected_offers(c)
        for link in ['https://prf.hn/short', offer()['destinationUrl'].replace('thegoodguys.com.au','evil.example'), offer()['destinationUrl']+'?secret=hidden']:
            with self.assertRaises(ValueError): monitor.destination(link)


if __name__ == '__main__':
    unittest.main()
