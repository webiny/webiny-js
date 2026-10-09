# Why Generate took 11 minutes and Capture 8 on check-job run 3

Diagnosis only; nothing changed. Source: the stage ledger of runs 1-3 of "2424Tulane Fixes Check",
and the generation log of every component on runs 2 and 3.

## Capture did not move

| Run | Capture | Pages |
| --- | ------- | ----- |
| 1   | 487 s   | 11    |
| 2   | 489 s   | 11    |
| 3   | 465 s   | 11    |

About 42 s a page, on every run. The 8 minutes looked new only because the prediction for run 3 ("about
20 minutes" for the whole run) was not taken from these figures. The prediction was wrong, not the stage.
Why a page takes 42 s is a separate question, not looked into here.

## Generate moved, and one component accounts for it

| Run | Generate | Output tokens | Calls |
| --- | -------- | ------------- | ----- |
| 1   | 346 s    | 149,370       | 25    |
| 2   | 376 s    | 169,851       | 24    |
| 3   | 656 s    | 198,175       | 22    |

Both runs used medium effort; the effort setting did not change between them.

On run 3, every component except the Footer had finished by +463 s after the first call. The Footer's
first attempt was cut off at the 5-minute per-call limit (`call-failed`, 300 s, no usage recorded). Its
retry took another 287 s and passed at +622 s. Two Footer calls back to back are the extra five minutes.

**The Footer sits at the limit on every run:**

- Run 2: 27,092 output tokens in 278 s, passed on the first attempt, 22 s inside the limit.
- Run 3, attempt 1: cut off at 300 s.
- Run 3, attempt 2: 28,383 output tokens in 287 s, passed, 13 s inside the limit.

At about 100 tokens a second, the Footer needs 270-300 s, so whether it finishes in one call is close to
a coin flip each run. Floor Plan Filter is next (248-251 s, 25-27K tokens).

## What it means for the 16th

- **Worst case:** with `MAX_ATTEMPTS = 3` and 5 minutes a call, the Footer can fail all three attempts
  after about 15 minutes and come out as "did not pass". It is the component on every page.
- **Output cap:** its 28K tokens are also close to `MAX_OUTPUT_TOKENS` (32K), and thinking counts
  against that cap. A run that thinks a little longer is cut off by tokens rather than time.
- **Already open:** this is the case in `ai-context/issues/generate-calls-time-out-and-leave-no-output.md`.
  Medium effort moved the Footer from timing out on most attempts to finishing on most, not on all.

Not decided here: a longer per-call limit for long components, a lower effort for them, or leaving it as
it is and re-generating the Footer if it fails on a demo run.
