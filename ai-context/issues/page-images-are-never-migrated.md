# Page images are never migrated: a composed page points at the previous vendor's CDN

> **Package:** `@webiny/api-component-extraction`, `@webiny/api-page-composition-poc`
> **Severity:** high — a migrated site depends on infrastructure the customer is leaving, and nothing
> in the output says so.

> **Sequencing:** this work comes **after** the image-binding defects found alongside it (shape,
> scalar coverage, invented images). Migrating assets perfectly while real images bind in a shape
> that does not render would change nothing a visitor sees.

## What happens today

Nothing downloads, stores or rewrites an image at any stage. Confirmed rather than assumed:

- `deriveInstanceProps.ts` handles scalar text only.
- `rewriteDestinations.ts` matches `/(^|\/)(url|href|link|to)$/i`, so an image path is never
  considered.
- The one `CreateFileUseCase` call in the pipeline is `createReferenceImage`, which uploads the
  **generation reference crop** — a machine input, not a page asset.

A composed page carries the captured URL verbatim and serves it from wherever the source page served
it.

## The finding that changes the rule

The images are **not on the source host**. Measured across the composed sites: **64 of 89 file-typed
bindings (72%) point at Cloudinary**, split between `res.cloudinary.com` and
`g5-assets-cld-res.cloudinary.com`. These are the previous marketing vendor's (G5) Cloudinary
accounts, not the customer's own infrastructure.

So the risk is not "the source host is decommissioned and images break". It is "the customer stops
paying the vendor whose CDN this is". A host-based rule — migrate same-host, leave third-party —
would have migrated **zero images on all five sites**, which is exactly backwards.

**Whether the customer has rights to this imagery is contractual and unresolved.** It must not be
assumed. It is useful to the customer either way: if they lack rights, they need to know before the
migration rather than after.

## The three-way rule (agreed)

The axis is **whether the customer keeps control of the asset after migration**, not which host
serves it:

- **Migrate** — every image the page rendered as content, whatever host serves it.
- **Leave** — images belonging to a third-party service the migration does not reproduce: map tiles,
  reCAPTCHA chrome, analytics pixels, social widget icons. Identified by being part of an embed, not
  by hostname.
- **Flag** — anything that cannot be fetched, anything truncated, and everything in the "cannot be
  seen" list below.

This reuses `DestinationOutcome`'s structure (`rewritten | external | unmigrated`) rather than adding
a parallel one: an `AssetOutcome` beside it, an `isImagePath` beside `isDestinationPath`, an
`image.unmigrated` discard kind beside `link.unmigrated` in `domain/types.ts`, and image counters
beside the page map's `links` tallies. **Do not silently leave a hotlink** — an image that cannot be
migrated is recorded, the same as an unmigrated link.

**Dedupe by content, not by URL.** The same image is served from several Cloudinary transformation
URLs, which are different URLs and identical source images. No deduplication exists in File Manager
today — `GetFileByUrlUseCase` is URL-keyed, not content-keyed — so it has to be built: hash the bytes,
keep a per-tenant content-hash → fileId map.

## What cannot be seen at all

Each of these is invisible to the pipeline, so none can be migrated and none is currently reported:

1. **CSS background images** — `STYLE_PROPS` in `captureEvaluator.ts` has no `backgroundImage`.
2. **Inline SVG** — `SKIP` contains `SVG` and `PATH`, so the subtree never enters the tree. Most
   logos.
3. **Responsive sets** — `mediaSource` reads `currentSrc || src`, one URL at the capture viewport.
4. **`<picture>` sources** — a `<source>` carries `srcset`, not `src`, so it records nothing.
5. **Video** — `blockResourceTypes` defaults to `["media"]` and nothing overrides it.
6. **Stylesheet-referenced images** — no CSS is parsed.
7. **Data URIs over 1000 characters** — see
   [media src truncated at 1000 characters](./media-src-truncated-at-1000-characters.md).

Items 1 and 2 are capture-shape changes and each needs its own measured pass, for the same reason the
zero-height wrapper fix did: un-skipping SVG affects segmentation on every site, and bundling it with
asset downloading would produce a change nobody can attribute.

## Where it should run

**At capture.** Images are not blocked (only `media` is), so the browser already fetches every one of
them, and `ChromiumBrowserProvider` already has a `page.on("response")` hook collecting fonts by
exactly this mechanism. Reading image bytes there gives the exact bytes the page rendered — including
the Cloudinary-transformed variant — with no second request to a vendor CDN that may already be
revoked.

Post-compose was the alternative and is worse on every count: it re-requests from that CDN, gets
whatever it returns today, and can never see the CSS backgrounds or responsive sets because that
information does not survive into the composed page.

The cost is that capture is already the most expensive stage and the one whose failure discards most
work. Bytes should stream from memory to S3 rather than through `/tmp`, with a bounded queue and a
per-page ceiling, and anything over the ceiling recorded rather than skipped.

## Upload path and per-file cost

The pattern exists in this package already (`createReferenceImage`): S3 `PutObjectCommand` to
`tenants/${tenant}/files/${key}`, then `CreateFileUseCase`. Not presigned POST — that is the browser
upload path. A renderable URL is `FileUrlGenerator.generateUrl(file)`, which is
`settings.srcPrefix + file.key`.

Per file: **one Headless CMS entry** (`CreateFileRepository` → `CreateEntryUseCase` on the private
`fmFile` model), plus before/after events, plus — for `image/*` — **an AI image enrichment background
task per file** unless `metadata.aiImageEnrichment: false`. At portfolio scale the enrichment opt-out
is not optional. `CreateFilesInBatchUseCase` amortises the permission check, validation and events
and should be the default.

Note the File Manager key convention: a file's id is the first segment of its key unless passed
explicitly. Getting that wrong produced
[every reference image sharing one file id](./every-reference-image-shares-one-file-id.md).

## Open questions

- **Is the private `fmFile` model indexed in OpenSearch?** This decides whether per-file cost is one
  DynamoDB write or that plus an index document, and at 20,000 sites it is the largest single cost
  lever. **Parked** — it matters only at portfolio scale and nothing before that depends on it. To be
  answered when the batch pipeline is specified.
- **Does the customer have rights to the vendor's Cloudinary imagery?** Contractual, theirs to
  answer, and it gates whether this work should run at all for a given site.

## A measurement limit, stated rather than estimated

The captured trees could not be read from the investigating environment: the run-image route
allowlists screenshot refs only, and the deployed bucket is not in the available AWS account. So
per-image URLs exist only for images that reached a composed page.

`SectionDigest.imageCount` gives **274 `img`/`picture` elements across captured sections** against 89
file-typed bindings on composed pages. The ~185 unbound images are **not** decomposed here. In
particular the "legitimately not content" share — icons, spacers, tracking pixels — cannot be
separated without the trees, and is not estimated.
