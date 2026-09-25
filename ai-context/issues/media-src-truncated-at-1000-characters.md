# A media `src` over 1000 characters is silently truncated into a corrupt value

> **Package:** `@webiny/api-component-extraction`
> **Severity:** medium — rare in absolute terms, but it is the silent-corruption shape rather than a
> missing feature: the value is neither usable nor detectably broken.

## The defect

`captureEvaluator.ts` caps every captured URL at 1000 characters:

```js
var URL_CAP = 1000;

function mediaSource(el) {
  try {
    if (MEDIA[el.tagName] !== 1) {
      return "";
    }
    return (el.currentSrc || el.src || "").slice(0, URL_CAP);
  } catch (e) {
    return "";
  }
}
```

The cap is right in intent — the comment says so: "a data: URI can otherwise be megabytes, and one
page's tree holds thousands of nodes". The problem is what a truncated value then looks like.

For an ordinary URL, 1000 characters is generous and the cap never fires. For a **data URI** it fires
almost always, and the result is a string that:

- is still a syntactically plausible `data:image/png;base64,...` value,
- decodes to a corrupt image or nothing,
- passes every downstream check, because nothing validates that a `src` is complete,
- and reaches a composed page as a binding that renders a broken image.

Nothing records that it happened. There is no discard-log entry, no counter and no flag on the node.

## Why it is the bad shape

The project already treats an unmigrated link as something that must be **recorded**
(`kind: "link.unmigrated"` in the discard log) rather than silently left. A truncated `src` is the
same class of loss with none of the same handling — worse, because an unmigrated link still works
against the live site, while a truncated data URI works nowhere and looks like a real value.

The same applies to `ALT_CAP = 300`, though a clipped alt text degrades gracefully and this does not.

## Fix sketch (not implemented)

Do not raise the cap — a megabyte data URI in a tree with thousands of nodes is the thing the cap
exists to prevent. Instead, make the truncation **visible**:

1. When the value exceeds the cap, drop it rather than storing a prefix, and set a marker on the node
   (`srcTruncated: true`) so the tree records that this element had a source and it was too large.
2. Have the composition step emit a discard entry for it, reusing the existing shape —
   `kind: "image.truncated"` alongside `link.unmigrated` in `domain/types.ts`.
3. Count it in the page map's per-run tallies, beside the `links` counters.

A stored prefix is worse than an absent value in every consumer: absent is detectable, a prefix is
not.

Related: the asset-migration work will need this, because a data URI is one of the few image forms
that needs no download — it is already the bytes. Truncating it turns the easiest case into the one
that cannot be recovered at all.
