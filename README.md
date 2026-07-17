# Australian Home Collective

Australian Home Collective is an Astro site with practical home and lifestyle guides for Australian households.

## Local development

```sh
npm ci
npm run dev
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

The GitHub Actions workflow builds and audits each change, but it does not deploy the site. Cloudflare Pages handles deployment from the connected repository. The previous VentraIP FTPS deployment is retired and must not be restored without an explicit deployment decision.

Cloudflare-specific redirects are maintained in `public/_redirects`.

## Content and quality checks

Editorial planning and publication standards are in `docs/content-plans`. Every substantial article revision requires a separate publication edit that preserves factual meaning, safety context, SEO intent, Australian English and useful links.

Use `npm run sitemap:update -- --commit <commit> --date YYYY-MM-DD` after a content commit to update the affected sitemap entries.
