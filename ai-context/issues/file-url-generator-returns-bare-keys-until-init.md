# FileUrlGenerator returns bare storage keys unless `init()` has run

> **Package:** `@webiny/api-file-manager`
> **Severity:** medium — nothing is broken today, because the one consumer that existed calls it
> correctly. It is filed as a trap for the next caller, which is what it caught.

## The defect

`FileUrlGenerator` builds a file's URL by prefixing its key:

```ts
class FileUrlGeneratorImpl implements Abstraction.Interface {
  private srcPrefix = "";

  public generateUrl(file: File): string {
    return this.srcPrefix + file.key;
  }

  public async init(): Promise<void> {
    const result = await this.getSettings.execute();
    this.srcPrefix = result.value?.srcPrefix ?? "";
  }
}
```

`srcPrefix` is empty until `init()` has read it from File Manager settings, where the installer sets
it to `${domain}/files`. So **`generateUrl` before `init` returns the storage key, not a URL** —
`71da6ac1-240e-4408-bae9-7a874fdfa1e2/logo.webp` instead of
`https://…/files/71da6ac1-240e-4408-bae9-7a874fdfa1e2/logo.webp`.

Nothing enforces the ordering. `init` is optional on the abstraction (`init?(): Promise<void>`), so a
caller that never calls it type-checks, compiles and runs.

Across the whole repository there is exactly **one** call site:

```
packages/api-file-manager/src/graphql/FmGraphQLSchema.ts:56:   await this.fileUrlGenerator.init();
```

The File Manager's own GraphQL schema calls it per request. Every consumer reached by any other route
— a background task, a stage handler, another feature's service — gets keys, silently.

## Why it is invisible

This is the part worth carrying, because it is the reason it survived a verification designed to
catch exactly this class of thing.

A bare key is not obviously wrong. Written into an `<img src>` it is a **relative path**, so it
resolves against the page rather than failing at the point of use; the browser simply asks the wrong
host and gets a 404 for a URL that looks structurally fine.

It also survives counting. An asset-migration pass verified its work with a table of image bindings by
origin — how many pointed at the vendor CDN, how many at Webiny, how many were empty. **That table
reads identically whether or not the bug is present**: the bindings had been repointed, nothing
pointed at the old host any more, and every count was what it should be. The defect only appeared
when the URLs were fetched **individually** and the first one returned 404.

So the lesson is the same shape as the concurrency bound in
[check-then-act on shared state](./check-then-act-on-shared-state.md): the output looked correct and
only a direct check of the property in question found it. Counting references proves what they point
at; only fetching them proves it resolves.

One aggravating detail: the generator is registered `.inSingletonScope()`. Whether an accidental
caller sees a prefix therefore depends on whether something else already ran `init` in that
container's lifetime, which makes the failure depend on what ran before it rather than on the caller's
own code. The container's lifetime was not measured here, so how often that masks the bug is unknown —
but "works when something else went first" is a worse failure mode than "never works".

## Fix sketch (not implemented)

The ordering should not be the caller's to get right. In rough order of preference:

1. **Resolve the prefix inside `generateUrl`**, so there is no order to get wrong. It needs the call
   to become async, or the prefix to be injected at construction.
2. **Make `init` non-optional and fail loudly** when `generateUrl` runs before it, rather than
   returning a key that looks like a value.
3. **At minimum**, say so on the abstraction: `init` is currently undocumented, and its optionality
   reads as "call this if you like".

Option 1 is the only one that removes the trap rather than labelling it; the others leave every future
caller one forgotten line away from shipping relative paths.
