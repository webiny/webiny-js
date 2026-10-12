# The sitemap is generated and not served

> **Package:** the website app (`next-website-migration-tool`), then `@webiny/api-page-composition-poc`
> **Severity:** low for the demo, which no crawler visits; required before a migrated site goes live.
> **Status:** open, deliberately. Decided 2026-10-12: generate it, do not serve it yet.

## What is there

Every publish writes `sitemap.xml` into the site tenant's File Manager. It lists the published pages at
the address "Open site" uses (the website domain, the path, `?wb.tenant=`), and the Site step links to
it. The previous publish's file is replaced, so a site holds one sitemap.

## What serving it needs, all of it

1. **A website route.** Nothing answers `/sitemap.xml`; the website has no `app/sitemap.ts` or route
   handler. The middleware already sets the tenant for that path (`/sitemap.xml` is inside its matcher),
   so the route could read the tenant's file or build the list itself.
2. **A per-site base URL.** The sitemap's `<loc>` must be the site's own address. Today every site
   shares the App Runner domain and is told apart by `?wb.tenant=`. The website's Open Graph URL is
   hardcoded to `https://example.com` (`app/(site)/[[...slug]]/page.tsx:69`) for the same reason.
3. **Host-to-tenant mapping.** A crawler sends no tenant cookie, so `/sitemap.xml` without
   `?wb.tenant=` resolves to root. A site on its own domain needs the host to name the tenant.
4. **A `robots.txt` replacement.** The website serves the starter's static `public/robots.txt`, which
   disallows everything (`User-agent: * / Disallow: /*`) and points at
   `http://localhost:3000/sitemap.xml`. Serving a sitemap while that file stands achieves nothing.
5. **A website redeploy** (image build and App Runner deployment) for 1 and 4.

Items 2 and 3 are the same decision a migrated site's go-live needs anyway, so this is best done with
it rather than before it.
