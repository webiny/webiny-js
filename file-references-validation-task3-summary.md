# Task 3 findings — summary

Full report: `file-references-validation.md` (§3.1–§3.6)

## The answer is better than expected: ID-keyed delivery already exists

**Delivery resolution never reads the filename.** `S3AssetResolver.resolve` takes the first path
segment as the file ID, looks up `FileManager/File/{id}/Metadata` in the key-value store, and
fetches whatever `metadata.bucketKey` says:

```ts
const fileId = ObjectKey.from(request.getKey()).id();   // first segment, rest discarded
const result = await this.keyValueStore.get(`FileManager/File/${fileId}/Metadata`);
const asset = new Asset({ …, key: metadata.bucketKey });
```

So `/files/{id}/photo.jpg`, `/files/{id}/anything-else.png` and `/files/{id}` all resolve to the
same object. Format detection uses the _resolved_ key too, so a filename-less URL doesn't break
transformations. **No routing change is needed for a stable ID-keyed URL — it's what the resolver
already implements.**

Resolution is **not** pure string manipulation. Two real lookups — the KV metadata read on every
request, and a full CMS entry read on every image transform.

## Key confirmations

**Key minting at source** (`FileKey.toString()`): `[keyPrefix]/{id}/{sanitized-filename}.{ext}`,
with `tenants/{tenantId}/files/` prepended at presign time and _not_ stored on the record. Unit
tests corroborate.

**Same ID, different filename:** `PreSignedPostPayloadInput.id` is client-supplied and passed
through with no uniqueness or collision check. Different filename → different key, both objects
coexist forever. Same filename → in-place overwrite, and with versioning off the old bytes are gone.

**Invalidation already exists and is already ID-keyed:**

```ts
generate(fileId: string) { return [`/files/${fileId}/*`, `/private/${fileId}/*`]; }
```

One call covers every filename and every query variant. But `FlushCacheOnFileUpdateHandler` fires
**only when `accessControl.type` changes** — a binary swap or key change triggers nothing today.
That guard is the change.

**S3 versioning is not enabled** — no `BucketVersioning` resource anywhere. If you turned it on,
`DeleteS3FolderTask` would silently stop deleting: it uses `listObjectsV2` + `deleteObjects` with no
`VersionId`, so you'd get delete markers, and noncurrent versions would never be enumerated or
purged. Versioning alone also wouldn't give you addressable history — nothing records a `VersionId`.

## The actual blocker is caching, not routing

CloudFront `/files/*`: `minTtl 0, defaultTtl 0, maxTtl 2592000` (30 days), full query string in the
cache key. But `defaultTtl: 0` defers to the origin — and the origin hard-codes:

```ts
"cache-control": `public, max-age=${86400 * 365}`   // S3StreamAssetReply.ts:10
```

`maxTtl` caps only what CloudFront stores. **Browsers get a one-year `max-age`, and no invalidation
can reach them.** That's the constraint version replacement has to design around.

## One bug found (noted, not fixed)

`SharpTransform.loadAssetCrop` reads `metadata.imageEdit`, but the file model stores the crop at
`metadata.image.crop`. `imageEdit` is read in two places and **written nowhere in the repo** — so
the asset-level crop set in File Manager never reaches delivery, and that per-request CMS entry read
is currently pure overhead.
