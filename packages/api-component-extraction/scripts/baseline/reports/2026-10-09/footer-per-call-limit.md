# Raising the per-call limit for Generate: cost and risk

Analysis and a recommendation; nothing changed. Follows `stage-timings.md`.

## What bounds a call today

- **Per-call limit:** `PER_CALL_TIMEOUT_MS = 5 min` (`componentGeneration.ts:62`).
- **Attempts:** `MAX_ATTEMPTS = 3`. A component's attempts all run inside one task invocation
  (`maxIterations = 1`), so inside one Lambda.
  - The background Lambda's timeout is 900 s (checked on the deployed function).
  - The task keeps 20 s for itself, so all attempts must finish within about 880 s.
- **Deadline:** `attemptBudget` gives each call `min(per-call limit, time left − 60 s)` and starts no
  attempt with less than 90 s left. That is what guarantees the best attempt is recorded before the
  Lambda ends. The 5 minutes is not.
- **Output cap:** `MAX_OUTPUT_TOKENS = 32,000`. Thinking counts against it.

## The premise has changed, and the measurements say the clock binds first

- **The 5 minutes was set when a cut-off call left nothing.** Since 2026-10-08 the call streams, so a
  cut-off call keeps its partial output and chunk timing. The deadline logic, not the 5 minutes, protects
  the recorded result.
- **Generation speed.** Across 35 attempts on check-job runs 2 and 3 (attempts with usage, over 20 s),
  the rate was 92 to 142 output tokens a second, median 111.
  - At the slowest observed rate, a call reaches the 32K cap at about **349 s**; at the median, about 289 s.
  - So whenever a long component generates slower than 107 tokens a second, about half the time, the
    300 s clock stops it before the output cap could.
  - The Footer (27-28K tokens) and Floor Plan Filter (25-27K) are exactly those components.
- **A runaway is bounded by the cap anyway.** The original incident, a call writing until the Lambda was
  killed, cannot recur in that form: the 32K cap ends a call at roughly 230-350 s whatever the clock.

## Recommendation: 7 minutes (420 s)

420 s sits above the time to 32K tokens at any rate down to 76 tokens a second, 17% below the slowest
observed. **The output cap becomes the constraint**, which is the right one:

- A component that needs more than 32K tokens ends with `finishReason: length`. It then fails its checks
  as a truncated answer, and the log says so plainly instead of saying "timed out".
- The Footer's 28K leaves it 12% headroom under the cap.

## What it costs

- **Per call that the clock used to cut:** the call now runs to its answer or to the cap, up to 120 s
  more. That is at most about 13K extra output tokens, about $0.13 at $10 per million.
- **Per call that now passes on the first attempt** instead of being cut and retried: it saves the
  retry, about 28K tokens, about $0.28, plus five minutes. On run 3 that is exactly the Footer's case.
- **Net:** neutral to slightly cheaper on runs like these. A cut-off call reports no usage, so today's
  figures already undercount what the 300 s calls cost.

## What it risks

- **One fewer long attempt in the worst case.**
  - With 420 s, two long attempts take about 850 s and leave too little for a third.
  - Today the third long attempt gets at most about 200 s (880 − 2 × 300 − 60 − overheads). That cannot
    finish a Footer anyway.
  - So nothing that could pass today loses its chance. Components whose attempts fail quickly still get
    all three.
- **Stage duration, worst case: unchanged.** It is bounded by the 15-minute invocation per component
  (and the coordinator's 17-minute child timeout) either way.
  - Typical case for runs like run 3: shorter. The Footer finishes in one call at about 300 s instead of
    two calls at about 590 s.
- **A genuinely slow provider day** (under 76 tokens a second) brings the clock back as the limit. That is
  visible in the log as `call-failed` with partial output, as today.
- **The test pins 300 s:** `recordResultOnce.test.ts` asserts `timeoutMs: 300_000`. It changes with the
  value.

## Not recommended now

Raising `MAX_OUTPUT_TOKENS`. At about 100 tokens a second, more output means a longer call, and at 64K the
clock would bind again and two attempts would not fit in one invocation. The Footer's 28K fits under 32K.

## Verification, if approved

Prediction: the Footer passes on its first attempt in 270-350 s, and no attempt ends `call-failed`.

1. Change the constant, update the test, deploy.
2. Regenerate the Footer alone on check-job run 3 three times, the targeted path (about $0.30 each).
   Three runs, because one pass proves nothing about a coin flip.
3. Report against the prediction. Every 2424 Tulane component would also benefit on the next full run.

## Result (2026-10-09, deployed, the Footer regenerated alone on check-job run 3, three times)

| Run | Duration | Output tokens | Outcome             |
| --- | -------- | ------------- | ------------------- |
| 1   | 61 s     | 8,137         | passed on attempt 1 |
| 2   | 284 s    | 28,357        | passed on attempt 1 |
| 3   | 268 s    | 27,462        | passed on attempt 1 |

- **Against the prediction.** "Passes on the first attempt, no `call-failed`" held 3 of 3. "270-350 s"
  did not: run 1 wrote a much shorter answer (8K tokens) in 61 s, and run 3 took 268 s.
- **What this does and does not show.** None of the three calls needed more than 300 s, so each would
  have passed under the old limit too. The verification shows the change breaks nothing; it does not
  show the change rescuing a call. The case it exists for, a call past 300 s, happened 0 times in 3
  here. The evidence for it remains run 3's original attempt, cut off at 300 s, and the rate measurements
  above.
- **Where the benefit will show.** The next full Generate on a demo site: a Footer or Floor Plan Filter
  attempt that runs between 300 and 420 s and passes, where the log would previously have recorded
  `call-failed`.

## A separate finding: thinking varies more than anything the limit addresses

Run 1 billed 8,137 output tokens; runs 2 and 3 billed 28,357 and 27,462. **Same component, same
prompt.** The system prompt, user prompt (14,091 characters) and image hash identically on all five
Footer attempts recorded today.

| Attempt             | Billed output | Answer (characters) | First text after |
| ------------------- | ------------- | ------------------- | ---------------- |
| original, attempt 2 | 28,383        | 21,649              | 228 s            |
| again, run 1        | 8,137         | 21,480              | 5 s              |
| again, run 2        | 28,357        | 18,597              | 232 s            |
| again, run 3        | 27,462        | 20,677              | 210 s            |

- **The answer is the same size every time** (18.6-21.6K characters, about 5-6K tokens).
- **What varies is the thinking before it.** Run 1 started writing after 5 s; the others thought for
  210-232 s first. At medium effort, the same prompt drew about 2K tokens of thinking once and about
  22K the other times. The stream carries no reasoning text (`reasoningChars` 0), so the amount is
  inferred: billed output minus the answer's size, and the silence before the first chunk.
- **All four passed their checks.** On this evidence the long thinking did not buy a passing answer.
  The short one passed as well.

**Why it matters more than the limit change.** The limit decides whether a long-thinking call is cut
off; this variance decides whether a call thinks long at all. It is also a 3.5× swing in this
component's cost and a 4× swing in its time, from one run to the next, with nothing changed.

**Not established:**

- whether answer quality differs between short- and long-thinking calls beyond passing the checks
  (that needs the rendered components compared);
- how often the short case happens (1 in 4 here is too few to say);
- whether a lower effort, or a thinking budget, would make the short case the usual one without
  costing quality.

Each is measurable on stored and targeted runs. None is decided here.
