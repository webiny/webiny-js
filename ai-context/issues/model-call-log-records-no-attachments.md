# The model-call log records no attachments, so what a call was shown cannot be recovered

> **Package:** `@webiny/api-component-extraction`
> **Severity:** low — nothing is broken by it. It is filed because its absence made a real defect
> unanswerable, and the same absence will make the next one unanswerable too.

## What is recorded

Every model call is recorded with:

```
stage, name, modelId, inputTokens, outputTokens, latencyMs, ok, createdOn
```

That is enough for cost and latency, which is what it was built for. It says nothing about **what the
call was shown**.

## Why it mattered

Generate attaches a reference image to each component's model call (`additionalFileIds`). A defect
gave every reference image the same File Manager id, so the id resolved to whichever crop had been
uploaded most recently, and generation runs four-wide — see
[every reference image shares one file id](./every-reference-image-shares-one-file-id.md).

The natural question is then: which components were actually generated against the wrong crop? It
cannot be answered. No component stores the reference id (it is used transiently), and the call log
records no attachment. So across five customer runs, **no component could be cleared and none could
be condemned**. The remedy was to fix the id and state the gap, because manufacturing a judgement
without the evidence would have been worse than the gap.

## Diagnostic value beyond that case

The same field would answer questions that recur in this pipeline:

- Which reference crop produced a component that looks right but is of the wrong section.
- Whether a retry was shown the same inputs as the attempt it was retrying.
- Whether a refine call carried the contract it was supposed to refine.

All of these are currently answered by re-running and comparing, which changes the thing being
measured.

## Fix sketch (not implemented)

Record the identifiers, not the payloads: attached file ids, the prompt's byte length, and a hash of
the prompt. Ids and a hash are small, cheap and enough to answer "was this call shown what we think
it was" without putting customer content or megabytes of prompt into the log.

Worth doing when something else touches the recorder — `ModelCallRecorder` is the single point every
model call funnels through, so it is one place, but it is not worth its own pass.
