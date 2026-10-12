# The website's metadata throws on an SEO block without meta tags

> **Package:** the website app (`next-website-migration-tool`), `app/(site)/[[...slug]]/page.tsx`
> **Severity:** medium. A page whose `seo` (or `social`) has no `metaTags` is served with no `<title>`
> and no description, with a 200 and nothing on the page to show it.
> **Status:** worked around in composition (2026-10-12); the website is unchanged.

## What happened

Composition began writing `properties.seo = { title, description }` on 2026-10-12. The website's
`generateMetadata` reads:

```ts
const otherSeoTags = page.properties.seo?.metaTags.reduce(...);
const otherOgTags = page.properties.social?.metaTags.reduce(...);
```

The optional chain stops only at `seo`. With no `seo` the expression is undefined; with a `seo` that has
no `metaTags` it throws "Cannot read properties of undefined (reading 'reduce')". Next.js logs "An error
occurred in the Server Components render" and serves the page body with no metadata at all.

The rehearsal site's three pages were served with no `<title>` from the publish at 12:51:18 UTC until the
fix was published at 12:55 and the website's cache turned over (last render error 12:56:30). Ten render
errors in the App Runner log, all in that window.

## The workaround

`pageSeo` always writes `metaTags: []`, which is the shape the admin's SEO settings save. A test reads
the result the way the website does (`sourcePageSeo.test.ts`).

## The fix

`seo?.metaTags?.reduce(...)` and `social?.metaTags?.reduce(...)` in the website, at the next website
redeploy. Any other writer of page properties (an import, a script) hits the same edge until then.
