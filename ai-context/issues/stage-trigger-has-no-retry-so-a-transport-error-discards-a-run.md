# A transport error while triggering a stage discards the whole run's completed work

> **Package:** operational — the end-to-end run drivers used for verification, and anything else that
> advances a run stage by stage.
> **Severity:** medium — no data is lost, but a run that has already paid for its expensive stages is
> abandoned because of one failed HTTP request.

## What happened

Verifying the zero-area capture fix, a driver advancing Park City Palace through its nine stages died
here:

```
TypeError: fetch failed
  [cause]: Error: read ECONNRESET
  at gql (e2e-run.mjs:25)
  at e2e-run.mjs:72        // the componentExtractionRunStage mutation
```

The run had completed discover, capture, segment, cluster and classify — **about 40 minutes**,
including a 2028s classify. All of it stayed on the server, correct and reusable. The driver
exited, because a single `componentExtractionRunStage` call hit a connection reset.

Worse, the request had actually succeeded: checking the run afterwards showed `plan=done`. The
failure was in reading the response, not in performing the work.

## Why it matters beyond a script

The pipeline is deliberately built so a run advances one stage at a time and each stage's result is
stored. That design makes a run resumable — the state to resume from is already on the server. Any
driver that treats a transport failure as fatal throws that away.

The expensive stages are the model-backed ones. Discarding a run after classify means paying for
classify twice, and the failure has nothing to do with the pipeline: it is a TLS read on a CloudFront
connection.

## What the driver should do

1. **Retry transport failures.** A `fetch` that throws is a different thing from a GraphQL error
   response. The first is worth retrying with a backoff; the second will not change.
2. **Be idempotent about triggering.** The reset above happened _after_ the mutation ran, so a naive
   retry would double-trigger. The driver should re-read the run's stage statuses and skip anything
   already `done` or `running` rather than assuming its own request failed.
3. **Resume rather than restart.** Given a run id, start from the first stage that is not done.

A resume driver written afterwards does all three and recovered the Park City run from `generate`
without re-running anything. The point of filing this is that it should not have needed writing after
the fact — the first driver should have had it.

## Not filed here

Classify took **2028s** on that run against **32s** on the same job's previous run — a 60× outlier on
a model-backed stage, almost certainly throttling. Not actionable on one instance; noted here so a
second instance has something to join.
