# Task 1 findings — summary

Full report: `file-references-validation.md`

## Headline: the assumption holds for half the write paths

**First, a terminology correction that matters:** there is no Page Builder in this codebase. v6 has
**Website Builder** — a different architecture where component React code lives in the customer's
Next.js app and Webiny stores only component names + input values. That changes where Task 5's
hooks can live.

**"Image references persist both file ID and URL" — partly true.** Eight distinct write paths
persist file references, in **six different shapes**:

| Stores ID + URL | Stores URL only |
|---|---|
| WB `createFileInput` → `Asset` object | **CMS `file` field → bare `String`** |
| CMS `asset` field → `Asset` object | WB background image → CSS `url("…")` |
| Lexical `wby-image` node → `{id, src}` | `fileUrl` field, custom icons |
| Page settings image / social image | |

The CMS `file` field is the sharp edge — `field.onChange(file.src || "")`
(`CmsFilePickerRenderer.tsx:39`), GraphQL type `String` / `[String]`. No ID, no name, no
dimensions. It's marked `deprecated = true` in favour of the newer `asset` field, but existing
models still use it.

**Mitigating finding:** the file ID is embedded in the key — keys are `{id}/{filename}`, URLs are
`{srcPrefix}{key}`, and app code already parses the ID back out of a URL
(`useCmsImageEditor.ts:16-24`). So URL-only references are recoverable. No migration needed to
make the index useful.

## Two things that change the cost of the work

1. **Reference-bearing content is gzipped at rest.** WB `bindings`/`elements` (`json`) and CMS
   `rich-text` are `{compression: "gzip", value: "<base64>"}` in storage. Worse, a `rich-text`
   nested inside an `object` is compressed *independently at its own position* — so extraction
   must walk the model field tree in step with the value tree, not scan raw records. A cheap
   table-scan backfill is off the table.

2. **The render path never reads the file ID — anywhere.** `ImageComponent` reads
   `inputs.image.src`; backgrounds render a CSS string; Lexical's `html` half carries only `src`.
   The stored ID is editor bookkeeping. Version-based replacement therefore can't work by
   "updating consumers through the ID" unless the delivery URL is stable — which is exactly the
   Task 3 question. **The two features are more coupled than the brief assumes.**

## Also worth flagging now

- **A/B test variants (`wbyWbVariant`) hold full content snapshots**, so every page reference can
  exist in N variant entries too.
- **There is no Form Builder in v6** — that bullet in the brief is moot.
- **The TS types lie:** `FileInput` is declared `BaseInput<string>` in
  `website-builder-sdk/src/types.ts:545` while the persisted value is an object. Don't derive the
  extractor from the input type union.
