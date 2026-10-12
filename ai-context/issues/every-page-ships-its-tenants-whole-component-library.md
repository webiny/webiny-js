# Every page ships its tenant's whole component Library: a root page is 6.1 MB, a site page 0.2 MB

> **Area:** platform, how a Website Builder page loads remote components. `@webiny/sdk-frontend`
> (`ComponentsSdk.loadComponents`), `@webiny/sdk-nextjs` (`GraphQLRemoteComponentLoader`), and the
> website app's page route. Not a migration defect: the migration only makes root's Library large.
> **Severity:** high for anything served from a tenant with a large Library, root included. Every page
> carries every component in its tenant, whatever the page uses.
> **Status:** open, as a platform question. Found 2026-10-12 during the site stage MS1 deployed check;
> not caused by MS1. **Root's 323 is not a live defect in the migration path:** see "Root's size is a test
> artefact" below.

## Measured (2026-10-12, the demo website on App Runner)

The same page, the webiny.com validation run's home page, fetched from the website with and without
its site tenant:

| Served from                                         | HTML size           | Component bundles in the HTML            | Components the page uses |
| --------------------------------------------------- | ------------------- | ---------------------------------------- | ------------------------ |
| root (`/`)                                          | **6,127,096 bytes** | **323** (every job's, in root's Library) | 6                        |
| site tenant (`/?wb.tenant=validationwebinycom0001`) | 214,241 bytes       | 6                                        | 6                        |
| 71 Westland rehearsal tenant (`/`), for scale       | 277,616 bytes       | 16                                       | —                        |

- **Same everywhere:** each of the validation run's 3 pages measured the same way, with root at 6.1 MB
  and the site at 0.2 MB.
- **What is counted:** bundles are counted by the `__remoteComponent__` marker each bundle begins with,
  and component names by their job namespace. Root's 323 span every extraction job (`2424Tulane/…`,
  `Validationwebinycom/…`, …).
- **Use:** the page uses 6 component instances (its page map's `composedInstances`).

## Cause

The website's page route (`next-website-migration-tool`, `app/(site)/[[...slug]]/page.tsx`) loads the
page and, in parallel, every remote component of the tenant:

```ts
sdk.components.loadComponents({ fetchOptions: { next: { revalidate: 60 } } });
```

It passes the whole list to `DocumentRenderer` as `remoteComponents`, so every bundle is serialised into
the page whether the document references it or not. `GraphQLRemoteComponentLoader.loadComponents()` in
`@webiny/sdk-nextjs` has the same shape: it fetches all bundled components of the tenant and hydrates
every one.

So page weight grows with the tenant's Library, not with the page. A tenant with one site and a few dozen
components barely notices. Root, which holds every extraction job's approved components, serves every
page at about 30 times the size it needs.

## Why it matters

- **Anything demoed from root carries 6 MB per page.** A per-tenant site does not: the site stage moves
  migrated sites out of root, and this is a second reason that matters. The 71 Westland fallback is in its
  own tenant and is unaffected (0.28 MB).
- **It scales with use.** Every approved component of every job adds to every root page, including pages
  that have nothing to do with the migration.

## Root's size is a test artefact, not how the product works

- **The direction is per-tenant.** The site stage already copies a job's components into the job's own
  site tenant, and that is where a migrated site is served from. The 71 Westland site carries its 16
  bundles at 0.28 MB.
- **Why root is large:** every test migration so far has approved components into one tenant, root. A
  customer's migration does not put its site in root.

So this issue is not a defect in the migration path. What follows is a platform question that stands on
its own.

## The question it raises (platform, open regardless of root)

Should a page load only the components its document references, by name, instead of the tenant's whole
Library? Loading every component is fine at 16 and not at 200, and a large customer site will have more
than a handful of components in its own tenant. The document already names each component it places, so
page weight could follow the page. Whether to resolve it on the server per document, or by loading
bundles lazily on the client, is a platform decision about the SDK and the website template, not a
migration one. It is worth deciding on its own terms, independent of root.

## Related, not MS1: stage 9 stages in root

Stage 9 (Approve components) writes the approved components into the extraction tenant's Library, root,
as a staging area, and the site build copies them from there. Root therefore accumulates every job's
components, whatever cleanup is done. Having stage 9 write into the site tenant directly would remove the
staging area. It is a bigger change than MS1: approval, collision handling, bundling and the composed
pages preview all read that Library today.

## Cleanup of root: after the 16th, not now

- **Why not now:** some of root's pages back things that may be shown.
- **Why the order matters:** deleting components that pages still reference has the same shape as
  deleting a tenant and leaving its content unreachable.
- **When it is done, the order is:**
  1. pages first;
  2. then their components;
  3. with a check before each component is deleted that nothing else references it.
