# Deployment notes

Public deployment is intentionally out of scope for the current phase. Nothing in this document has been executed against a public host. The repository produces a pure static export and can be deployed later without changing application code.

## Build

Requires Node.js 22+.

```bash
npm ci
SITE_URL=https://your-domain.example npm run build
```

The output is in `out/`. `SITE_URL` controls canonical URLs, `sitemap.xml`, `robots.txt`, and absolute Open Graph URLs. It has no trailing slash; the code normalizes it. The default `https://model-hub.example` is a placeholder and must not be used for a public launch.

The build reads only the committed, validated `data/latest` snapshot. It does not fetch upstream data or need secrets.

## Hosting

Any static host that serves directory indexes works. For Cloudflare Pages, use:

- Build command: `npm run build`
- Build output directory: `out`
- Environment: `SITE_URL=https://your-domain.example`
- Node version: 22

No server functions, KV, D1, or secrets are required. If mainland-China access becomes a hard requirement, use a compliant domestic static host/CDN and complete ICP filing before launch.

## Before the first public deployment

1. Complete the human sign-off items in [`legal-review.md`](legal-review.md).
2. Replace the placeholder `SITE_URL`; rebuild and verify canonical, OG image, `sitemap.xml`, and `robots.txt`.
3. Verify `/compare` and query-parameter views are noindex/blocked; clean pages remain indexable.
4. Confirm the public GitHub Issues entry works and that the removal process is reachable from every page.
5. Publish a private contact channel for sensitive rights-holder requests.
6. Run `npm run test:e2e`, the axe smoke test, and Lighthouse CI against the production build.
7. Enable GitHub Actions `CI` and `Refresh data`; confirm the refresh workflow can commit to `main` or adjust it to open a PR if branch protection is enabled.
8. Review the host's access-log retention and privacy terms, then update `/about` if needed.

## Continuous data updates

`.github/workflows/data.yml` runs daily and on manual dispatch. It downloads sources, refreshes the ECB rate, validates the snapshot, regenerates JSON Schema, and commits only `data/latest`, `data/fx.yml`, and `data/schema` when the snapshot changes. A failed validation leaves the previous latest snapshot in place. It does not deploy.

If the repository uses branch protection, change the workflow to open a pull request instead of pushing directly, and require the `CI` workflow before merge.
