# Every Generate reference image is created with the file id "component-extraction"

> **Package:** `@webiny/api-component-extraction`
> **Severity:** **high** — it was live, it corrupts the visual ground truth a component is generated
> from, and Generate fans out concurrently so the wrong crop can be read by design rather than by
> race alone.

> **Status: fixed.** The id is now passed explicitly and the key is shaped `${id}/${filename}`. Kept
> as the record of what it was and how far the damage can be established.

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

**How far this can be established.** No component stores a reference file id — it is used transiently
in the generation call — and the model-call log records only `stage, name, modelId, inputTokens,
outputTokens, latencyMs, ok, createdOn`, with nothing about attachments. So **which crop any given
component received cannot be recovered**, and no existing component can be shown to be wrong.

What can be established is that the exposure was real rather than theoretical. Reconstructing each
generate call's window from `createdOn` and `latencyMs`:

| run                   | generate calls | wall  | summed | peak concurrent |
| --------------------- | -------------- | ----- | ------ | --------------- |
| parkcityplace (fresh) | 11             | 366s  | 998s   | **4**           |
| 2424tulane            | 24             | 1060s | 2858s  | **4**           |
| thevibe               | 38             | 564s  | 1885s  | **4**           |
| 71westland            | 38             | —     | 2910s  | **4**           |

Summed latency is roughly three times wall time and up to **four generations were in flight at once**
on every run, so the single constant file id was being replaced while other generations were reading
it. (71westland's wall time spans a resume gap and is not meaningful; its concurrency is.)

## The fix

Both: the id is passed explicitly **and** the key is shaped the way File Manager expects, so the
convention is satisfied rather than worked around and the two cannot disagree.

```ts
const fileId = randomUUID();
const fileKey = `${fileId}/${slug(input.planned.name)}-reference.png`;
```

The run id moves to `metadata.componentExtractionRunId`. It was in the key for grouping; nothing
deletes these files by key prefix today, so nothing depended on that grouping — checked before
changing it.

Worth checking at the same time whether any other caller builds a File Manager key without an id-first
segment; this convention is easy to miss because nothing enforces it and the failure is silent.
