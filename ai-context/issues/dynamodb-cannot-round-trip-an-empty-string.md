# An empty string written to a stage artifact reads back as null

> **Package:** `@webiny/api-component-extraction` (cause is in `@webiny/aws-sdk`)
> **Severity:** **high** — a second unguarded consumer exists and would fail a whole stage. See
> _How likely_ below: its trigger has not been observed, so there is a case for medium.

## The defect

Every Webiny document client is built with `convertEmptyValues: true`, and the option is deliberately
not exposed (`packages/aws-sdk/src/client-dynamodb/getDocumentClient.ts`):

```ts
/**
 * We do not want users to be able to change these options, so we are not exposing them.
 */
const documentClientConfig: TranslateConfig = {
    marshallOptions: {
        convertEmptyValues: true,
        ...
    }
};
```

So `""` is marshalled to DynamoDB NULL and comes back as `null`. Every JSON stage artifact goes
through that client — `domain/stage.ts` states the split, and only binaries (screenshots, raw DOM) go
to S3. Generated component detail is included: it is fetched with
`store.getJson<ComponentResultArtifact>(entry.resultRef)` on the same store.

A model writing an empty string for an optional field is therefore enough to produce a `null` in a
field typed `string`. The types say this cannot happen, which is why nothing guards against it.

## Confirmed instance

`parkcityplace / Site Navigation Header`, prop `logoLink.label` — a logo link with no visible text:

```json
{ "name": "label", "type": "string", "optional": true, "observedValues": [null] }
```

`parsePlanContract` filters non-strings when parsing the model's response, so this was a valid `""`
when written. The null appeared on the way back out of storage.

## What it broke

`validateTextPreservation` took `renderedValues` as an argument in the text-preservation rewrite, and
`normalise(null)` throws. Generate calls the validator **outside any try/catch**
(`componentGeneration.ts:308`), so the result is an uncaught `TypeError` that fails the stage rather
than the component. Guarded now, with a test.

It had already caused a wrong conclusion. `parkcityplace / Site Navigation Header` was failing a
measurement harness "at bundling" while bundling fine standalone, and was written off as a harness
artefact and left unexplained. It was this crash: the harness wrapped bundling and validation in one
`try`, so a validator `TypeError` was reported as a bundling failure. **An unexplained disappearance
was treated as acceptable and it was a real crash behind a harness that wrapped two operations in one
try.** That is the more useful lesson than the null itself.

## The second consumer

`AssembleHandler.ts:76`:

```ts
validateTokenBinding(component.css, validVariables);
```

`validateTokenBinding` does `css.matchAll(...)` with no guard, and `component` is read back from the
artifact store. A generated component with **empty CSS** would therefore fail the Assemble stage
outright. The same call at `componentGeneration.ts:321` is safe, because there `output.css` is the
model's in-memory response and has not round-tripped.

## How likely

Measured across the six stored runs: **0 of 71** generated components have empty or null CSS, and the
shortest real CSS is 1,101 characters. So the second consumer is structurally reachable but its
trigger has not been seen. Filed **high** because an unguarded consumer that fails a whole stage is
the severity rule this project uses; downgrade to medium if the rarity is judged to matter more than
the blast radius.

## Fix sketch (not implemented)

Three options, in increasing order of how much they fix:

1. **Guard each consumer.** What was done for the validator. Cheap, and endless — every future reader
   of a model-written optional string is a new instance.
2. **Normalise on read.** One place in the artifact store that turns `null` back into `""` for fields
   typed `string`. Needs to know the shape, or to be applied blanket-wise, which risks flattening a
   `null` that was meant.
3. **Do not write empty strings.** Strip empty optional strings at the parse boundary
   (`parsePlanContract` and the equivalent for generated components), so the artifact never contains
   one. The field is optional; absent and empty mean the same thing to every consumer here.

Option 3 looks best and is the smallest, but it is a change to what artifacts contain, so it wants
its own measured pass against stored runs rather than riding along with something else.

Worth checking whether anything outside this feature relies on `convertEmptyValues`, since it is set
globally for every Webiny document client and this feature is unlikely to be the only place a `""`
becomes a `null`.
