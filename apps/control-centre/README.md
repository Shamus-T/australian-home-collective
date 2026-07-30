# AHC Control Centre

Private analytics and publication dashboard for Australian Home Collective.

This application is deliberately separate from the public Astro publication. It combines:

- Cloudflare traffic totals and top paths;
- Google Search Console clicks, impressions, CTR, positions, pages and queries;
- GA4 users, sessions, engagement, views and landing pages;
- first-party AHC search terms, no-result searches and selected results;
- the live sitemap inventory;
- Facebook and Bing daily CSV imports;
- a plain-English action queue;
- integration and synchronisation health.

It does not require Gmail access.

## Architecture

- Cloudflare Worker with static assets for the private application.
- Cloudflare Access protects every asset and API request.
- Access JWT signatures, issuer, audience and expiry are validated in the Worker.
- Cloudflare D1 stores consolidated reporting data.
- A daily Cron Trigger refreshes configured APIs.
- The public AHC Pages project writes anonymous search events to the same D1 database through `functions/api/search-analytics.js`.

## 1. Create the D1 database

From this directory:

```bash
npm install
npx wrangler d1 create ahc-analytics
```

Copy the returned database ID into `wrangler.jsonc` in place of:

```text
REPLACE_WITH_D1_DATABASE_ID
```

Apply the schema:

```bash
npm run db:migrate:remote
```

For local development:

```bash
npm run db:migrate:local
```

## 2. Bind D1 to the public AHC Pages project

In Cloudflare Workers & Pages, open the Australian Home Collective Pages project and add a D1 binding:

```text
Variable name: AHC_ANALYTICS_DB
D1 database: ahc-analytics
```

Add it to Production. Add it to Preview only when preview search events should also be retained.

The public search endpoint deliberately returns `204 No Content` when the binding is absent, so deployment cannot break the Pagefind search experience.

## 3. Configure Cloudflare Access

Create an Access self-hosted application for the eventual Control Centre hostname, for example:

```text
dashboard.australianhomecollective.com.au/*
```

Use an Allow policy restricted to the site owner's account or exact email address. Do not use a public bypass policy.

Copy these values into `wrangler.jsonc` or configure them as Worker variables:

```text
ACCESS_TEAM_DOMAIN=your-team-name.cloudflareaccess.com
ACCESS_AUD=the application Audience (AUD) tag
```

The Worker rejects requests when these values remain placeholders. A header's presence alone is not trusted; the Access JWT signature and claims are verified against Cloudflare's rotating JWK set.

For local development only, set a Wrangler secret named `DEV_BYPASS_TOKEN` and send the same value in `X-AHC-Dev-Token`. Do not set this secret in production.

## 4. Deploy the Worker

```bash
npm run check
npm run deploy
```

Attach the desired custom domain after the first deployment. Confirm the Access policy is active before treating the hostname as private.

The Cron Trigger is configured for `18:20 UTC`, which is `04:20` the following day in Queensland. Cloudflare Cron Triggers use UTC.

## 5. Google Search Console and GA4

Use a dedicated Google Cloud service account rather than a personal Gmail connection.

Grant the service-account email read access to:

- the Search Console property;
- the GA4 property.

Set Worker variables/secrets:

```text
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account-name@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=the PKCS#8 private key from the service-account JSON
SEARCH_CONSOLE_SITE_URL=sc-domain:australianhomecollective.com.au
GA4_PROPERTY_ID=the numeric GA4 property ID
```

Store `GOOGLE_PRIVATE_KEY` with `wrangler secret put GOOGLE_PRIVATE_KEY`. The code accepts either real newlines or escaped `\n` sequences.

Search Console uses the read-only scope. GA4 uses the analytics read-only scope.

## 6. Cloudflare traffic analytics

Create a custom API token restricted to the Australian Home Collective zone with Analytics Read permission.

Set:

```text
CLOUDFLARE_ZONE_ID=the AHC zone ID
CLOUDFLARE_ANALYTICS_TOKEN=the zone-scoped analytics token
```

Store the token with:

```bash
npx wrangler secret put CLOUDFLARE_ANALYTICS_TOKEN
```

The Worker queries the GraphQL Analytics API for eyeball traffic, hourly requests, visits, transfer and top paths.

## 7. Facebook and Bing

Version 0.1 uses CSV imports so the application does not need broad Meta or Microsoft account permissions.

Facebook CSV headers:

```text
date,reach,engagements,link_clicks,followers
```

Bing CSV headers:

```text
date,clicks,impressions,ctr,position
```

CTR may be supplied as a decimal (`0.045`) or a percentage (`4.5`). The browser converts percentages before upload. Imports are limited to 1,000 daily rows per request.

## 8. Privacy and retention

The public search collector stores only:

- event type;
- normalised search phrase;
- result count;
- selected internal AHC path;
- a random browser-session identifier;
- broad device category;
- timestamp.

It does not intentionally store names, email addresses, full IP addresses or full user-agent strings. Search events older than 400 days and integration-run logs older than 180 days are deleted during synchronisation.

The public Privacy Policy must remain aligned with this behaviour.

## 9. Validation

Run:

```bash
npm run check
```

This checks Worker and browser JavaScript syntax and runs the Access, parsing, integration-state, import-validation and action-queue tests.

The public-site test is run separately from the repository root:

```bash
npm run test:search-analytics
```

## Current boundary

This first release is operational but intentionally conservative:

- Google and Cloudflare data refresh automatically after credentials are configured.
- AHC search intelligence is first-party and automatic after the shared D1 binding is configured.
- Facebook and Bing use controlled CSV import.
- Commission Factory, Microsoft Clarity summaries and GitHub build-status ingestion are not yet automated.
