# PR notes — summaries for entry activity records

Working notes for the pull request description. Accumulated per checkpoint so nothing has to be
reconstructed at the end. Not part of the shipped behaviour.

---

## What the reader needs to know about the storage interface

Six operations and one record-shape addition, all of which a replacement store inherits.

`summaryRunId` is the addition: a joining save stores the id of the record that opened its run, and
a save that joined nothing resolves to its own id at the read boundary. It is one field on a write
the debounce already performs, and it is what makes grouping exact rather than inferred.

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

## Two generators, one summary

A save is described either by a model or mechanically, never both, and the record says which
(`summaryKind`). The routing rule decides, and its shape inverted when the renderer arrived: the
caps that used to decide _whether a save is summarised_ now decide only _whether a model is worth
it_. They were written to bound what gets stored on a record and sent to a provider, and a
mechanical render does neither — it reads values already in hand and stores one sentence.

Only two outcomes now produce no summary at all: a non-interactive write, and a save with nothing to
describe (a publish, a move, a purely structural edit).

**The mechanical path is the stronger one on privacy.** It runs inside the recorder with the values
already in hand, so it writes the finished sentence in the same append — no transient values on the
record, no dispatch, no job, nothing for the sweeper to reclaim. The model's path has to park values
on the record precisely because its job runs a minute later in another process.

It is also the fallback when a model fails: the job holds the same values, so a provider outage now
costs the reader nothing rather than costing them the sentence.

**The disclosure consequence, stated plainly.** Value quoting moves from rare to normal. Before, a
save with two short text fields recorded paths and labels and nothing else; now it records
"Changed Tier from Starter to Essential", permanently, readable by anyone who may read the timeline.
Over the sixteen representative saves measured earlier, 2 routed to a model and 8 routed
`too-few-text-fields` — those 8 are the ones that begin quoting. The kind of disclosure is not new;
the frequency is.

The integration test that asserted the old absolute claim (`records the path and the label, never
the value`) was rewritten rather than deleted. It now asserts the two halves separately: the
changeset carries paths and labels and never a value, and the summary quotes both sides on purpose.

## The marker changed meaning without changing code

`SummaryLine` renders "AI-generated" on a model's sentence and nothing on a rendered one. That
component behaved correctly before deterministic sentences began quoting values and behaves
correctly after — but what it _signals_ changed underneath it.

Before, only generated sentences quoted values, so the marker read as a disclosure signal: marked
means "this one may contain content". Now both tiers quote, so it is purely a provenance signal, and
it is the only thing separating an exact restatement of recorded values from an interpretive
sentence that can be wrong.

Nothing in the test suite would have objected to someone marking both tiers in the name of
consistency, and doing so would have made the distinction invisible while looking like tidying up.
It is now covered three ways — a deterministic sentence on a collapsed row, one inside an expansion,
and both kinds in one expansion with exactly one marker counted — plus a source guard that the
literal is defined once.

Worth recording as a class rather than an incident: a signal can be redefined by a change somewhere
else entirely, and the component carrying it will not fail.

## Deliberately weak tests, and why they are not redundant

Five assertions pin the capability guidance — that it forbids added formatting, requires both sides
of a quoted value, carries the judgement failure as an example, explains why consistency matters,
and still asks for short values to be quoted at all.

Each is a substring check against a prompt string, and each will read as redundant prose to anyone
tidying the suite. They are not guarding against a regression in behaviour. They guard against
**deletion**: every one of those lines was written against something a model actually did, and a
prompt is the one artefact in this feature where removing a sentence has no compiler, no type and no
failing assertion to stop it. The file comment says the same thing beside the guidance itself.

## A flake, recorded so a second occurrence has something to attach to

`__tests__/capture/coverage.test.ts` was once reported as a failed _suite_ with all 96 of its tests
skipped, on a full `ddb` run. It passed in isolation immediately afterwards, passed on two later full
runs, and passed throughout on `sql`. Not chased — one occurrence of a suite-level skip is not enough
signal — but noted here so a second one starts from a report rather than from scratch.

## An observation about where generated sentences earn their place

Both sample outputs from real testing describe a scalar-heavy product model — SKU, price, on-sale,
name — and against the mechanical sentences beneath them they add very little. Most of what they did
add was the part that went wrong: a fabricated currency symbol, a one-sided comparison, a verdict on
the content.

The routing rule fires on free-text field _count_, but the value of a generated sentence comes from
having prose worth characterising. Those are not the same thing, and on a model of mostly scalars
the mechanical sentence is arguably the better one.

Not acted on. Worth remembering when there is real usage, so the question asked then is whether
generated sentences earn their place on models like that one, rather than only whether they fire
often enough.

## A layout bug the suite could not see, three times

The same defect appeared three times in the design pass and the suite was green through all three:
the saves inside an expansion sat eight pixels off the sentence above them, the fields line on a
collapsed row sat twenty pixels inside the sentence it replaces, and every line meant to read at
11, 12 or 13px rendered at 14.

None of them is a typo anyone would catch reading the diff. Each was one branch of a conditional
being given its own left edge — `grid grid-cols-[16px_1fr]` in one arm, a hand-written `pl-xs` in
the next — and the arms are mutually exclusive, so no single render shows both. The type-size one
was subtler still: `Text` defaults to `size: "md"`, `text-md` is not a font size tailwind-merge
recognises, so it survived the merge and won on stylesheet order. The class was in the DOM and had
no effect.

Two things came out of it worth keeping.

**Measure the running app, not the screenshot.** Reading computed `left` values and text-node
ranges out of the browser found all three in minutes and told us the exact pixel error; inferring
from a screenshot had been wrong twice before that. It is also what caught a false alarm — an
element box at 910 with 20px of padding is text at 930, and comparing a box against a text-node
range makes a fixed bug look broken.

**Give the shared edge one owner and test the branches go through it.** There is one `GutterBlock`
now, and three tests assert each branch renders inside it. jsdom computes no layout, so these
cannot assert pixels — they assert structure, which is the thing that actually varied. Each was
verified by rendering its line outside the gutter and watching only that test fail.
