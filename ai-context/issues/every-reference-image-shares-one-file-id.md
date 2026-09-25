# Every Generate reference image is created with the file id "component-extraction"

> **Package:** `@webiny/api-component-extraction`
> **Severity:** **high** — it is live, it corrupts the visual ground truth a component is generated
> from, and Generate fans out concurrently so the wrong crop can be read by design rather than by
> race alone.

## The defect

`CreateFileUseCase` derives the file id from the **first path segment of the key** when no explicit id
is given (`CreateFileUseCase.ts`):

```ts
const [id] = input.key.split("/");
```

That is the File Manager convention: a key is `${fileId}/${filename}`. `createReferenceImage`
(`componentGeneration.ts`) does not follow it:

```ts
const fileKey = `component-extraction/${input.runId}/${randomUUID()}.png`;
...
const created = await deps.createFile.execute({
    key: fileKey,
    size: bytes.length,
    type: "image/png",
    name: `${input.planned.name} reference`,
    metadata: { aiImageEnrichment: false }
});
```

The first segment is the literal string `component-extraction`, so **every reference image ever
created has the id `component-extraction`**.

## Confirmed live

`fileManager.listFiles` on the deployed environment returns:

```
totalCount : 1
id         : component-extraction
key        : component-extraction/6ab64551fdf1d100025dddd9#0001/63677256-....png
name       : Resident Portal CTA reference
createdOn  : 2026-09-25T10:05:49Z
```

**One file record exists in the entire File Manager.** That timestamp falls inside the parkcityplace
Generate stage (started 10:05:04), i.e. the most recent run. Every earlier reference image is an
orphaned S3 object with no record pointing at it, and each new create has overwritten the previous
record rather than adding one.

## What it costs

`generateComponentAttempts` passes the returned id straight into the model call:

```ts
const fileId = await createReferenceImage(deps, input);
const additionalFileIds = fileId ? [fileId] : [];
```

The id is a constant, so the file that id resolves to is "whatever was uploaded most recently". Since
Generate fans out to concurrent child tasks (`GenerateComponentTask`), a component can be generated
against **another component's reference crop**, and across runs against **another site's**.

The reference crop is the visual ground truth for the whole generation. Being handed the wrong one
produces a component that is plausibly built and wrong, which is the failure mode hardest to see in
review — it looks like a normal component, just of the wrong section.

This has not been proven to have caused a specific bad component; what is proven is that the
mechanism is live and that only one file record exists. Whether past generations were affected can be
checked by re-generating one component in isolation and comparing.

## Fix sketch (not implemented)

Pass an explicit `id`, or key the object the way File Manager expects:

```ts
const fileId = randomUUID();
const fileKey = `${fileId}/${input.planned.name}-reference.png`;
```

The second is better: it satisfies the convention rather than working around it, and it makes the S3
key self-describing. The run id, which the current key carries for cleanup, belongs in `metadata` —
and cleanup by prefix then needs rethinking, which is the one non-trivial part of this fix.

Worth checking at the same time whether any other caller builds a File Manager key without an id-first
segment; this convention is easy to miss because nothing enforces it and the failure is silent.
