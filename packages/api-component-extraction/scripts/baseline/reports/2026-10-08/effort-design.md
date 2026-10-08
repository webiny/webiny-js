# Effort: design and predictions

Written before any run. Issue: `ai-context/issues/generate-calls-time-out-and-leave-no-output.md`.

## Question

Generate's calls set no thinking level, so the model (`anthropic/claude-sonnet-5`) thinks at its
default, high. About three quarters of billed output is thinking, and on the Site Header and Footer it
runs calls into the 5-minute limit. Does a lower effort keep quality while cutting duration and cost?

## Arms

The same prompt in each; only the `effort` the call sends differs. Dry-run experiments: nothing replaces
a component or writes a stage result.

| Arm             | `effort`          |
| --------------- | ----------------- |
| `effort-high`   | unset (default)   |
| `effort-medium` | `medium`          |
| `effort-low`    | `low`             |

All three arms run at the same moment on each repeat, so provider speed drifts alike for each.

## Components

| Component                            | Run      | Why                                                        |
| ------------------------------------ | -------- | ---------------------------------------------------------- |
| Site Header with CTA Links           | check    | timed out; 23.7K thinking tokens on its passing attempt    |
| Footer with address and office hours | check    | timed out; 21K thinking tokens on its passing attempt      |
| Hero Intro                           | baseline | long (14-20K characters); measured in every earlier pass   |
| Amenities Highlights                 | baseline | measured in every earlier pass                             |
| Social Media Links                   | check    | **control**: 54s and 5.5K tokens, thinking is not the cost |

FAQ Section, the third component of the earlier passes, no longer exists on the check run: re-clustering
replaced it. Hero Intro and Amenities Highlights carry the comparison with earlier passes.

Two repeats: 5 components x 3 arms x 2 = 30 generation tasks, each up to 3 attempts. Estimated $10-14.

## Measures

The dependent variable is quality, measured only by the existing checks:

- **Validators passed on first attempt**, and **attempts per component**.
- **Spacing fidelity** by kind (`spacing_fidelity_by_kind`, the measured spacing as the reference).
- **Colour accuracy** (`d_hex`, role-aware) and **type accuracy** (`d_heading`).
- **Props a contract carries that its representative lacks**: fixed by Plan, which a dry-run Generate
  does not touch, so it cannot move between arms. Reported once to confirm, not as an outcome.

Also recorded: duration, billed output tokens, answer length, time to the first text chunk, cost,
timeouts. A rendered comparison may follow, but does not decide.

## Predictions

Should change:

1. Duration and billed output fall with effort: medium below high, low below medium, on Site Header,
   Footer and Hero Intro.
2. No Site Header or Footer attempt times out at medium or low. At high, at least one of their four
   runs times out again (the check run timed out 6 of 6, today 1 of 2).

Should not change:

3. Answer length within 30% across arms (it moved at most that much across prompt versions).
4. Medium: every quality check within the spread the high arm shows between its own two repeats.
5. The control: every quality check unchanged at medium and at low. It thinks about 3.6K tokens, so
   there is little for a lower setting to take away.

Not predicted with confidence:

6. Low on the long components. Less thinking may show as more first-attempt validator failures; if so,
   retries could cost back what low saves.

## Decision rule

Adopt the lowest effort whose quality checks are within the high arm's own repeat-to-repeat spread,
on every component and the control. A difference inside that spread is noise at this resolution: two
repeats find a large regression, not a small one, and the result is stated that way.
