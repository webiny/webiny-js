# Task 4 findings — summary

Full report: `file-references-validation.md` (§4.1–§4.6)

## Good news first: the locked plan already works for derivatives

The transform path is a **read-through S3 cache with two levels**, both writing back to the *same*
bucket. Derivative keys:

```
tenants/{t}/files/{id}/optimized/[{framingHash}/]{filename}
tenants/{t}/files/{id}/optimized/[{framingHash}/]{transformHash}-{filename}
```

**The derivative key embeds the filename.** So a new binary at a new key under the same `{id}/`
prefix produces clean new derivatives automatically — a stale derivative structurally *cannot* be
served for the new binary. No code change needed.

Two caveats: **orphans accumulate** (nothing prunes on update; only deletion clears the `{id}/`
folder — version history holding N previous keys multiplies this), and there is **no other cache
layer** — no rendition bucket, no KV cache, no `/tmp` or in-memory buffer cache. The only
warm-container survivor is a memoised Sharp *module handle*, not image data.

## Three things that need action

**1. `/files/{id}` is not invalidated.** `generate()` returns `/files/${fileId}/*`, which requires a
literal `/` after the id. Task 3 established `/files/{id}` resolves and is served — so it'd be
cached at the edge and never purged. Latent today, live the moment you adopt filename-less URLs.
One-character fix: drop the slash. *(Query variants are covered by the trailing `*` — that part is
AWS-documented behaviour I can't verify from the repo, so Medium confidence.)*

**2. The TTL split touches 4 literals, not 1.** `S3StreamAssetReply.ts:10` and
`StreamAssetReply.ts:10` (both 365 d), **plus both private-file redirect strategies** (30 d each).
Miss the private ones and public/private files diverge. There's no separate transform response path
— a transformed image gets the same header as an original. `PublicCache`/`PrivateCache`
parse-and-restringify, so `s-maxage` survives them.

**3. Filename-less URLs are a code change, not a settings change.** `srcPrefix` *is* per-tenant
(tenant-scoped `KeyValueStore`; delivery metadata uses the *global* store — different scopes). But
it's read at exactly three concatenation sites and nowhere else — nothing parses or branches on it.
Since URL = `srcPrefix + file.key` and `file.key` carries `{id}/{filename}`, no value of
`srcPrefix` can drop the filename. Also worth knowing: changing `srcPrefix` invalidates nothing; the
only subscriber to the settings event is audit logging.

## One thing to avoid, one bonus

**`keyPrefix` breaks delivery entirely.** It's a supported SDK parameter producing
`{keyPrefix}/{id}/{filename}`, but delivery takes the ID as the *first* path segment — so it reads
`"p"` instead of the id, misses the KV lookup, and 404s. Same off-by-one breaks invalidation and
deletion. **The replacement flow must never set it.**

**Closes a Task 3 open question:** `S3AssetResolver` reads delivery metadata with no options, but
the store supports `{ consistent }` → DynamoDB `ConsistentRead`. So right after a `bucketKey`
update, delivery can briefly resolve the *old* key. Passing `{ consistent: true }` closes that
window.
