# The retry prompt tells the model a truncated version of the text it dropped

> **Package:** `@webiny/api-component-extraction`
> **Severity:** medium — the retry mechanism is sound and already feeds failures back; it just feeds
> back a prefix of the evidence. Filed, not fixed, in the text-preservation pass.

## What happens

When a generated component fails validation, the next attempt is told exactly what went wrong
(`componentGeneration.ts`):

```
"Your previous attempt was rejected by automated validation.
 Fix EXACTLY these issues and keep everything that was already correct:"
 - missing text: "..."
```

That is the right design, and it was already in place — an investigation into text-preservation
failures proposed "feed the exact missing fragments into the retry prompt" as a cheap remedy and
found it was the current behaviour.

The flaw is in how the fragment is written (`features/shared/validators.ts`):

```ts
.map(text => `missing text: "${text.slice(0, 40)}"`)
```

Forty characters. A dropped paragraph is reported to the model as its first forty characters:

```
missing text: "Let loose and indulge in all the fine th"
```

The model is asked to restore text it is shown a prefix of. For a heading that is enough; for the
long descriptive paragraphs that make up most genuine drops, it is not.

## Why it is not the cause of the failures it appears next to

Measured across five sites, 14 of 16 components that failed text preservation retried and failed on
**the same fragments every time**. That is not the model mis-restoring a truncated string — under the
validator as it then stood, those fragments were unreachable: a correctly parameterised component
cannot contain text that arrives as a prop, so no amount of prompting would have satisfied the check.
The validator has since been changed to read the rendered component instead.

So this is a real flaw that was not the bottleneck, and fixing it in the same pass would have made it
impossible to tell which change did what.

## Fix sketch (not implemented)

The cap exists so a failure list cannot grow without bound, which is reasonable for an artifact field
and unreasonable for a prompt. They are different consumers and want different lengths: the stored
`ValidationResult` can stay short, while the retry prompt should carry the fragment whole, or at least
several hundred characters, and say when it has truncated.

Worth measuring afterwards the way the validator change was: pass rate before and after, and whether
components that retried more than once start recovering.
