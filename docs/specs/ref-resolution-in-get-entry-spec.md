# Ref Resolution in getEntry and listEntries

## 1. Problem

`LiveSdk.getEntry()` resolves ref fields automatically via `resolveEntryRefs`, but `LiveSdk.listEntries()` does not. This forces consumers to either:

- use the `<RefField>` React component for lazy client-side resolution, or
- call the standalone `resolveRefs()` function manually after `listEntries`.

The `<RefField>` component adds a loading state and client-side fetch cycle for data that could be resolved before rendering. This prevents server-side use cases like JSON-LD generation, where all referenced entities must be available at render time.

## 2. Current Behavior

### getEntry

`LiveSdk.getEntry()` calls `resolveEntryRefs()` before returning. This method:

1. Looks up the model from `modelCache` to get `metadata.refModels`.
2. Calls `collectRefs()` to find all `{ id, modelId }` stubs in the entry values.
3. Fetches each unique ref via `this.getEntry()` (recursive — nested refs are resolved too).
4. Replaces stubs in-place via `setAtPath()`.

Result: the returned entry has all ref fields fully resolved, including refs nested inside objects, arrays, and dynamic zone templates.

### listEntries

`LiveSdk.listEntries()` returns entries with ref fields as raw `{ id, modelId }` stubs. No resolution occurs.

### RefField component

`<RefField>` exists to bridge this gap on the client. It reads the `{ id, modelId }` stub, fetches the referenced entry via `RefCache`, and renders a loading state until resolution completes. This is a workaround, not a design goal.

## 3. Proposal

Resolve refs in `listEntries` the same way `getEntry` does — by calling `resolveEntryRefs` on each returned entry before returning the result.

### Changes to LiveSdk

```ts
async listEntries<T>(params: ListEntriesParams): Promise<CmsListResult<T>> {
    const result = await this.webiny.cms.listEntries<T>({ ... });

    if (result.isFail()) {
        return { data: [], meta: { ... } };
    }

    const { data, meta } = result.value as CmsListResult<T>;

    const resolved = await Promise.all(
        data.map(entry => this.resolveEntryRefs(entry, params.modelId))
    );

    return { data: resolved, meta };
}
```

This requires `getModel()` to have been called before `listEntries()` so the model is in `modelCache`. This is already the case in both the Next.js article page and the editing flow (where `EntryStore` loads the model before fetching entries).

If the model is not cached, `resolveEntryRefs` returns the entry unchanged — the same silent fallback `getEntry` uses today.

### RefField component

Once `listEntries` resolves refs, `<RefField>` is no longer needed for rendering ref data. Consumers access resolved refs directly:

```tsx
// Before
<RefField<Author> value={entry.values.author} loading={<Spinner />}>
    {([author]) => <p>{author.values.name}</p>}
</RefField>

// After
<p>{entry.values.author.values.name}</p>
```

`<RefField>` can be deprecated and eventually removed.

### Editing mode

In editing mode, the `EntryStore.resolveRefsLazy()` mechanism re-resolves refs whenever the entry is patched. This already runs at the store level before components re-render, so removing `<RefField>` does not affect live editing.

## 4. Ref Resolution Mechanics

The `collectRefs` function in `refUtils.ts` recursively walks the entire value tree:

- **Plain objects**: iterates all keys, descending into nested values.
- **Arrays**: iterates all elements (handles ref lists and DZ template arrays).
- **Dynamic zones**: skips `_templateId` and `__typename` keys, walks everything else — so ref fields inside template values are found.
- **Ref detection**: any object with `{ id: string, modelId: string }` where `modelId` exists in the `refModels` map.

This means refs at any nesting depth — inside objects, arrays, and DZ templates — are resolved without special handling.

## 5. Performance Consideration

Resolving refs in `listEntries` adds API calls proportional to the number of unique refs across all returned entries. For a list of N entries with M unique refs total, this adds M additional `getEntry` calls (deduplicated by ref ID).

Mitigations already in place:
- `resolveEntryRefs` deduplicates refs by ID before fetching.
- All ref fetches run in parallel via `Promise.all`.
- The `LiveSdk` model cache avoids redundant `getModel` calls.

For large lists where ref resolution is not needed, consider adding an opt-out parameter:

```ts
listEntries({ modelId: "article", resolveRefs: false })
```

Default should be `true` (resolve) to match `getEntry` behavior.

## 6. Files

| File | Change |
|------|--------|
| `packages/cms-sdk/src/LiveSdk.ts` | Add `resolveEntryRefs` calls in `listEntries` |
| `packages/cms-sdk/src/ContentSdk.ts` | Pass through `resolveRefs` param if opt-out is added |
| `packages/cms-sdk/src/types.ts` | Add `resolveRefs?: boolean` to `ListEntriesParams` if opt-out is added |
| `packages/cms-nextjs/src/RefField.tsx` | Deprecate |