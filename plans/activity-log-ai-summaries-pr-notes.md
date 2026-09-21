# PR notes — AI summaries for entry activity records

Working notes for the pull request description. Accumulated per checkpoint so nothing has to be
reconstructed at the end. Not part of the shipped behaviour.

---

## What the reader needs to know about the storage interface

Six operations, not five. `extendSummaryValues` was added after the debounce turned out to need a
write that replaces a pending record's transient values without disturbing the keyset ordering the
reader pages on. The interface is the seam a replacement store has to satisfy, so each addition is a
promise that store inherits — a seventh would want the same argument made again.

`findStaleValues` is the only operation that looks across targets, and the only one the current
storage does badly: on the DynamoDB-only backend each page is a full model read. A complete sweep of
an N-record model costs roughly N/100 full model reads. This belongs at the top of the storage-swap
list.

## The always-restart defect

`findStaleValues` originally restarted from the oldest record on every call, bounded at twenty pages
of a hundred. Settled records stay exactly where they are, so on an installation past two thousand
activity records the scan could never reach anything newer — abandoned content values on the
installations big enough to matter would have sat there indefinitely, with a sweeper reporting
success. The fix is a resumable cursor, `null` meaning the data actually ran out; the sweeper
carries it across its own continuations.

Worth recording because the sweeper was green before the fix and green after it.

## Nothing fires the sweeper yet

`selfCleanup` on the summary job, plus the job's own clear-on-every-path, cover every route except
two: a Lambda timeout, and a task created whose execution never starts. Both leave content values on
the record until something sweeps, and **nothing schedules the sweep today**.

The task is written, registered and invocable. Scheduling it is a deliberate follow-up rather than an
omission, and the reason is the cost above: a nightly sweep at roughly N/100 full model reads would
be the most expensive scheduled thing in the product on a large installation, in exchange for
covering two failure modes. That price is wrong on the current storage and becomes reasonable on the
replacement, so scheduling it now would buy a guarantee we would immediately want to renegotiate.

There is also no general recurring-task facility to hang it on. The whole repository has exactly one
cron rule — a hardcoded EventBridge rule in `ApiGraphql.ts` firing a `WebinyEmptyTrashBin`
detail-type at the GraphQL Lambda — and `api-scheduler` is not general (its action type is literally
publish or unpublish). `CleanupStaleMultipartUploadsTaskDefinition` is the precedent: registered,
and fired by nothing. A task with no trigger is a known shape here rather than an oversight of ours,
and whoever takes the follow-up should know they are building the facility, not using one.

**One option, described but not built.** The dispatcher already reads the previous record for the
same target on every dispatch. Clearing that record when it carries values past the threshold would
cost one write and no extra read. It guarantees nothing — it only reaches targets with continued
activity — but it would clear the common case for free, on exactly the entries people are still
editing.

## `EmptyTrashBinTask` as a cautionary precedent

Twice now, and never as a model. Its `while (true)` re-lists the same page when a delete fails
persistently, and it checks its timeout twice in a row. Both the purge task (PR #5682) and the
sweeper here are modelled on the purge task's stall detection instead.

Removing the sweeper's stall detection does not produce a failing test — it runs the vitest worker
out of memory. A loop that re-reads the same batch forever has no failing assertion to report, which
is plausibly why the defect survived in the original.

## Guard 3 and guard 4

**Guard 3** (required-token capture) did not see the case it was built for. Extension-provided
dependencies — `ResolveAiCapabilityUseCase` and `Ai` — were declared as required, which would have
made any install without AI Power-Ups unable to record an entry at all. The conformance harness
caught it because it registers no extensions. This is the same failure class as `PurgeOnEntryDeleted`.

**Guard 4** (capitalised-token parser) produced two false positives before it produced anything
else: it read capitalised words out of comments inside a dependencies array. Fixed, with two
self-tests verified against the old parser. It then did its job — it caught `ActivitySummaryVisibility`
as a newly required dependency on the read path and made the case for it explicit rather than
implicit. Worth recording both halves: the guard was two-for-two on false alarms before it earned
its keep.

## The planning-containment defect

Widening `ActivityWriter`'s signature to carry the summary plan put the planning call inside the
recorder's outer `try`, so a throw from `plan()` swallowed the activity record along with itself.
Found by a test written for it, fixed with separate `planSummary`/`followSummary` containment. Worth
recording because the next person to change that signature needs to know it happened once.

## Tests verified by making them fail first

Standing rule from Checkpoint 3: any test asserting that a guard, cap or refusal fires is verified by
breaking the thing it guards. The full list belongs in Checkpoint 8.
