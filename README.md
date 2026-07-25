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
Cloudflare Turnstile on the server and sends the message through Cloudflare Email Service to
one verified Email Routing destination address.

Manual Cloudflare setup:

1. Enable Cloudflare Email Routing for the domain.
2. Add the destination inbox under Email Routing destination addresses and complete Cloudflare's
   verification email.
3. Configure these production variables and secrets in the Cloudflare Pages project:

- `TURNSTILE_SECRET_KEY` — encrypted Turnstile widget secret.
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account that owns the Email Routing destination.
- `CLOUDFLARE_EMAIL_API_TOKEN` — encrypted API token permitted to call the Email Service REST API.
- `CONTACT_VERIFIED_DESTINATION_EMAIL` — the verified Email Routing destination inbox. This is
  the only recipient the function will send to.
- `CONTACT_FROM_EMAIL` — sender address on the Cloudflare Email Routing domain.

The form does not use arbitrary-recipient Email Sending and does not require Workers Paid. The
browser cannot choose or override the recipient; all messages are sent only to
`CONTACT_VERIFIED_DESTINATION_EMAIL`. Production and preview variables are configured separately
in Cloudflare Pages.

## Content and quality checks

The canonical publishing standards and current roadmaps are indexed in `docs/README.md`. Every substantial article revision requires a separate publication edit that preserves factual meaning, safety context, SEO intent, Australian English and useful links.

Use `npm run sitemap:update -- --commit <commit> --date YYYY-MM-DD` after a content commit to update the affected sitemap entries.
