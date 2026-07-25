# Australian Home Collective

Australian Home Collective is an Astro site with practical home and lifestyle guides for Australian households.

## Local development

```sh
npm ci
npm run dev -- --background
```

The production build and audits are:

```sh
npm run audit:commercial
npm run build
npm run audit:site:dist
npm run audit:commercial:dist
```

## Production deployment

Production hosting is provided by Cloudflare Pages through its connected GitHub repository.

- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: 22

The GitHub Actions workflow builds and audits each change, but it does not deploy the site. Cloudflare Pages handles deployment from the connected repository. Do not add an alternate deployment path without an explicit deployment decision.

Cloudflare-specific redirects are maintained in `public/_redirects`.

### Contact form

The contact form posts to the Cloudflare Pages Function at `/api/contact`. It validates
Cloudflare Turnstile on the server and sends the message with Cloudflare Email Service.

Configure these production variables and secrets in the Cloudflare Pages project before
deploying the function:

- `TURNSTILE_SECRET_KEY` — encrypted Turnstile widget secret.
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account that owns Email Service.
- `CLOUDFLARE_EMAIL_API_TOKEN` — encrypted API token with Email Sending: Edit permission.
- `CONTACT_TO_EMAIL` — verified destination inbox.
- `CONTACT_FROM_EMAIL` — sender on a domain onboarded to Cloudflare Email Service.

The sending domain must be onboarded under Cloudflare Email Service before the form can deliver
messages. Production and preview variables are configured separately in Cloudflare Pages.

## Content and quality checks

The canonical publishing standards and current roadmaps are indexed in `docs/README.md`. Every substantial article revision requires a separate publication edit that preserves factual meaning, safety context, SEO intent, Australian English and useful links.

Use `npm run sitemap:update -- --commit <commit> --date YYYY-MM-DD` after a content commit to update the affected sitemap entries.
