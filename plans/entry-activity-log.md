# Plan: Headless CMS entry activity log

**Worktree:** `/Users/svenalhamad/Dev/webiny-entry-activity-log`
**Branch:** `feat/entry-activity-log`, created from `next` @ `270b8058d50500eed4d7eaa136b3e662f48f3402`
**Prior work:** `ai-context/investigations/cms-entry-activity-log.md` and `…-storage.md` (both against `release/6.5.0` @ `9966e024b9`)

Seven checkpoints. Each ends with a report and waits for confirmation. No checkpoint is combined with the next.

---

## Checkpoint 1 — worktree, verification, plan (this document)

Complete. Findings in the accompanying report.

One blocker was found and resolved: stable item `_id`s do not exist on `next` — PR #5606 landed on
`release/6.5.0` on 2026-08-27, which is 32 commits ahead of `next`, last forward-merged 2026-08-03.

**Decision: stay on `next` and treat stable ids as a declared dependency.** The differ is a pure
function over two value trees, so id matching takes full unit coverage from synthetic values
carrying `_id`, independently of whether the CMS mints them. Integration tests assert the id-less
behaviour until the forward-merge lands, and the PR states the dependency explicitly.

This is not a workaround being tolerated. Id-less values are a permanent requirement: every entry
written before #5606 carries no ids until its next save, so "absent ids" and "absent ids becoming
present" are behaviours the differ owes regardless of which branch it is built on.

---

## Checkpoint 2 — storage and record shape

**Package placement — confirmed by sven, 2026-09-10**, before this checkpoint opened. Two packages,
generic naming, with an internal boundary that keeps a later split mechanical:

```
packages/
  api-activity-log/
    src/
      core/      target-agnostic: storage interface, record shape, hasher, differ
      cms/       event handlers, recorder, purge task, APW step diffing
      graphql/   read query
      ActivityLogAppFeature.ts
  app-activity-log/
    src/         admin timeline (hooks + components)
```

Plus `canUseActivityLog()` across `wcp`, `api-core`, `app-admin` and `project` — a dedicated gate,
never `canUseAuditLogs`, so that moving from enterprise to business tier is a license-side change
with no code change in the feature.

Rationale: `api-record-locking` is the closest precedent (one backend package, `domain`/`features`/
`graphql` plus an AppFeature, depends on `api-headless-cms`, carries no license code itself). The
six-package workflows family is for features serving several target apps today; this one serves CMS,
and storing target type from day one is what buys WB and File Manager later instead of a package
split now. Consistent with the consolidated choice made for the collaboration feature.

**The narrow interface.** One abstraction, three operations, nothing else:

- `append(record)` — one record, no batch variant until a caller needs one.
- `list({ targetType, targetId, revision?, actor?, limit, cursor })` — newest first, cursor
  paginated.
- `deleteAllForTarget({ targetType, targetId })` — for purge cleanup.

Registered as a decoratable DI abstraction so the lighter mechanism can be swapped in without
touching capture, read API or UI. This interface is the whole point of the checkpoint: the private
model behind it is known to be a stopgap (see the storage report's verdict), so nothing above it may
depend on CMS-entry semantics, on `list`-with-filter, or on the model being queryable at all.

**Record shape.** `targetType`, `targetId`, `revision`, `timestamp`, `actor` (id, type,
displayName), `action`, `source`, `correlationId`, `changeset`. Target type always `cms-entry` in
v1 but stored, not implied.

**Changeset entry.** `path`, `label` (captured at write time so the timeline survives model
changes), and `operation` for structural changes. No values, ever — not before, not after, not
truncated.

**No persisted hash — a deliberate departure from the original brief** (decided 2026-09-10).
The brief specified a hash per changed field. Three reasons it is not stored:

- **Nothing reads it.** A no-op save is already signalled by an empty changeset, so hashes are not
  needed for suppression, and no consumer compares a stored hash against another record's.
- **It leaks the very thing the feature promises not to store.** With any derivable salt, a
  low-cardinality field's new value is recoverable by hashing the candidates — a boolean is two
  guesses. And for the lowest-cardinality fields the changeset entry leaks it anyway: recording
  that a boolean changed states its new value.
- **The one genuine consumer is speculative.** Detecting a revert to a previous value is the only
  use that needs persisted hashes, and it is not specified. Introducing a secret, choosing its
  source on AWS, choosing it again for Standalone, and carrying a recoverable-value leak in the
  meantime is too much cost for a feature nobody has asked for.

**One-way door, accepted.** A hash cannot be computed retroactively for a record that never stored
one, so if revert detection is specified later it will work only from that point forward.

**Hashing stays inside the differ.** Subtree short-circuiting and id-churn detection both compare
two trees hashed fresh within a single save, so they are unaffected. With nothing persisted there is
nothing to salt against — a constant salt cancels out inside one comparison — so hashing is a pure
function, not an injectable service.

**The deterministic serialiser is still specified and unit-tested in isolation**: sorted keys,
`null` / `undefined` / empty string collapsed to one representation, one canonical number format,
and type tags so a numeric string cannot collide with a number.

**Path encoding.** Id-keyed segments for repeatable-object and dynamic-zone items, with a defined
encoding for items that carry no id — both cases exist on `next` and both persist after #5606
lands. Paths are fully qualified from the entry root: the investigation established that item ids
are unique only within a single array, not within an entry, so an unqualified path is ambiguous.

**Deliverable:** the abstraction, one private-model implementation, the serialiser and hasher, unit
tests for hash determinism. No capture, no read API.

### Delivered

`packages/api-activity-log`, 55 unit tests passing, builds and lints clean, `adio` clean.

Only the API package was scaffolded. `app-activity-log` arrives at Checkpoint 6 rather than being
created empty five checkpoints early.

**One structural deviation from the confirmed layout.** The private-model adapter sits in
`src/storage/privateModel/` rather than under `core/`. `core/` now contains no CMS import at all,
which is what makes the boundary real rather than nominal — and the adapter is precisely the part
that gets thrown away when the lighter mechanism lands, so it earns its own directory. `cms/` is
still reserved for capture.

```
src/
  core/                      no CMS imports
    abstractions.ts          ActivityLogStorage: append / list / deleteAllForTarget
    types.ts                 record shape, action unions, changeset entry
    errors.ts
    paths.ts                 path encoding, common-parent roll-up
    hashing/                 canonicalize, hashValue (pure, differ-internal)
  storage/privateModel/      the replaceable adapter
  ActivityLogAppFeature.ts
```

**Findings that changed the implementation:**

- **Private models bypass authorisation entirely.** `PrivateModelBuilder` sets
  `authorization: false`, which `AccessControl.modelAuthorizationDisabled()` short-circuits to
  true. Capture therefore cannot be denied by a narrowly-permissioned editor's own rights — a save
  by any identity records successfully. The same fact means the read API inherits _no_ protection
  from storage, so Checkpoint 5 has to enforce all of it.
- **`where` must go through `CmsWhereMapper`.** Custom model fields filter under `where.values`,
  not at the top level. A hand-built top-level `where` type-errors on some keys and would silently
  match nothing on others.
- **`fields.datetime()` defaults to date-only**, discarding the time. The variant has to be stated;
  `withTimezone()` is used so each record is an unambiguous instant.
- **Only `meta.hasMoreItems` is trustworthy for paging.** The DynamoDB backend emits a cursor even
  once the result set is exhausted, so a caller following the cursor alone pages forever, paying a
  full model read per empty page. `list` returns `null` unless `hasMoreItems` agrees.
- **Model resolution follows `ScheduledActionModelProvider`** — an async provider, no memoisation
  (the CMS model cache is already per-request), no `withoutAuthorization` wrapper.
- **`deleteAllForTarget` is bounded.** It re-reads from the start each pass, since deleting the page
  just read shifts the offset the cursor encodes, and it returns a failure rather than success when
  it runs out of passes, so unfinished work is visible to the caller.

### The conformance suite is a merge requirement, not an artefact

**No storage adapter merges without running the conformance suite green, the append-stability test
included.** That is a gate, not a recommendation.

The reason to state it that strongly is that the suite is simultaneously the reason to trust a swap
and the reason to distrust any adapter that ships without it. Both defects it found on its first
run were in code that had already been reported as complete and tested, and both were invisible to
278 unit tests because those tests exercise fakes. An adapter that has not run this suite has not
demonstrated it can store and page an append-only log; it has only demonstrated that it compiles.

A third defect surfaced on a later run, which makes the same point again: the ordering test failed
intermittently because the sort key was unique but not monotonic, so records written inside one
millisecond came back scrambled. It had passed earlier by luck. Any adapter can get this wrong, and
only a suite that runs repeatedly against real storage will say so.

`__tests__/conformance/storageConformance.ts` is a parameterised suite defined against
`ActivityLogStorage` and nothing else — no models, no entries, no cursor it can read. The
private-model adapter runs it today against a real CMS and a real storage backend; a replacement
store runs the same file unchanged, so the swap is verified rather than assumed. Adding a second
implementation costs one ten-line file.

It covers ordering, cursor stability while records are appended between pages, same-millisecond
ordering, revision and actor filtering (separately and combined), target isolation, purge
completeness and idempotency, and empty-target behaviour. It runs on both `sql` and `ddb`, with no
storage flag required — nothing silently skips.

**It immediately caught two defects that 278 unit tests had missed**, both invisible without real
storage:

- **Every `list` call was broken.** `sort: ["timestamp_DESC"]` throws "Sorting field does not exist
  in the content model". Model fields sort as `values_<fieldId>_<ORDER>` — underscore-separated,
  and `extractSort` matches a bare name only against top-level meta fields. The read path had never
  once succeeded.
- **A permanent delete would have failed whenever background tasks were not registered.**
  `TaskService` was a required constructor dependency of `PurgeOnEntryDeleted`, and the event
  publisher _constructs_ handlers before any of them run, so the `isPrivate` guard inside `handle`
  could never be reached. Now optional, which is the only form of the guard that works.

**The cursor is opaque, and now genuinely so.** The CMS cursor is a base64-encoded _offset_
(`DdbListEntries.ts:165-173`, paginating by `slice(start, end)`), which is wrong twice for this
dataset: unstable under append, since a record arriving between two page reads shifts every later
record down and re-shows page one's tail — the ordinary case on an append-only log read
newest-first — and meaningless to any other store. So the adapter mints its own cursor from a
private `sequence` key (timestamp plus a random suffix, so it cannot tie inside one millisecond)
and pages by keyset. The CMS cursor never crosses the interface, callers treat the value as a
string, and each implementation is free to define its own format.

**Two decisions raised in the Checkpoint 2 report, both since resolved:**

- **Persisted hashes: dropped.** See the record shape section above. The hasher and its per-target
  salt abstraction went with them — with nothing stored, the salt secured nothing.
- **Tier gate: deferred to just before the pull request** (decided 2026-09-10). Left as written for
  now. See the pre-pull-request items in Checkpoint 7; this must not ship as-is.

---

## Checkpoint 3 — capture and the CMS differ

Split into two reports; 3a and 3b are separately confirmable.

### 3a — recorder and event handlers

One thin handler per event, each delegating to a shared `ActivityRecorder` that owns everything
substantive: the `model.isPrivate` filter, actor resolution from `IdentityContext`, source
labelling, correlation id minting, diffing, and persistence.

Thirteen logical actions over twelve event modules — move-to-trash and permanent delete share
`Cms/Entry/AfterDelete`, discriminated by the payload's `permanent` flag (see the Checkpoint 1
report). Actions: create, update, revision create, revision delete, publish, unpublish, republish,
move, move to trash, restore, delete, delete multiple, revision description update.

**Failure containment is the hard requirement.** Handlers run inline, sequentially, awaited, inside
the write — verified unchanged on `next`. The recorder catches everything and never rethrows; a
failure is logged and dropped. Audit logs rethrows today (`AuditLogEntryAfterUpdateEventHandler`
wraps in `WebinyError.from` and throws), which fails a save that has already persisted. Do not copy
that.

**Actor.** From `IdentityContext` only. Never `context.security` — and note the legacy shim is gone
on `next`, so the old anonymous-identity trap no longer exists. Never `entry.savedBy`, which is
client-settable through the manage API. Key name recorded for API-key writes, with no attempt to
distinguish agents from other token holders.

**Source label** is mandatory on every record. **Bulk operations** write one record per entry
sharing a correlation id.

`ForceDeleteDecorator` is documented as a deliberate gap: it writes through
`DeleteEntryStorageOperation` directly and publishes nothing.

**Scheduling.** A scheduled publish or unpublish _executing_ is already covered — it arrives as an
ordinary `Cms/Entry/AfterPublish` / `AfterUnpublish` with the scheduling user impersonated, and the
source label is what distinguishes it from a human publish. **Scheduling an entry and cancelling a
schedule are not covered and are out of scope for this checkpoint** — see the Checkpoint 1 report
for what capturing them would require. Nothing in this build depends on them.

**Purge cleanup owns `deleteAllForTarget`.** A permanently deleted entry's records must be
reachable, and permanent retention means there can be a lot of them, so cleanup runs as a
background task rather than inline in the after-delete handler. `EntryAfterDeleteEvent` with
`permanent: true` fires once per entry on every purge path — manual, bulk, and the scheduled
auto-purge — and enqueues the cleanup task rather than doing the deletion itself.

`EmptyTrashBinTaskDefinition` is the structural model for that task — continuable, with
`isCloseToTimeout()` checks and `response.continue(...)`. **Read it critically, do not copy it:** it
contains the same `isCloseToTimeout()` block twice, and its `while (true)` loop re-lists the same
first page every iteration with no `after` cursor, converging only because each pass deletes the
page it just read. A cleanup loop over immutable records has no such accident to rely on, so it
must page with a real cursor.

Note also that the inline best-effort cleanup pattern used by workflows and the scheduler
(list with `limit: 10000`, loop, swallow errors) does not scale to this dataset. That is the
pattern being deliberately declined.

**Four guards**, as tests, not conventions:

1. Every entry write use case publishes an event.
2. Every entry event has a handler or an explicit, named opt-out.
3. **Every handler and service constructs against the bare minimum** — a container holding only the
   platform abstractions the feature may assume, with background tasks deliberately absent.
4. **No required dependency outside the platform contract**, read from the source, so a handler
   nobody remembered to add to guard 3 still cannot introduce one unnoticed.

Guards 3 and 4 exist because construction is a failure mode of its own. `EventPublisher` resolves
every handler for an event before invoking any of them, so a required dependency that is not
registered throws _inside the write_, before any guard in `handle` and before any `try` in the
recorder exists to catch it. Every test in the containment suite exercises an already-constructed
handler, so none of them can see it. `PurgeOnEntryDeleted` shipped with exactly that defect —
`TaskService` required, its own `isPrivate` guard unreachable, every permanent delete failing in
any project without background tasks.

### 3a — delivered

278 unit tests passing, build and lint clean, `adio` clean.

Twelve thin handlers over a shared `EntryActivityRecorder`, the purge task, the coverage guards.

**Failure containment is tested from nine angles**, since it is the requirement that matters most:
storage returning a failed `Result`, rejecting, and throwing synchronously; identity resolution
throwing; source resolution throwing; a malformed model, a malformed entry, and model fields that
are not the shape the type claims. Every one asserts `record()` resolves. The failure is reported
to the console rather than swallowed silently.

**Source labelling needed the task probe, which is a finding rather than a design choice.**
Identity alone cannot distinguish a scheduled publish from a hand-clicked one: `TaskControl` and
`ExecuteScheduledActionUseCase` both impersonate the initiating human, so both writes arrive with
the same identity of the same type. Without a probe, every machine-executed write would be recorded
as that editor having done it by hand. `TaskExecutionContext` is the intent channel that already
exists — its presence answers "is a task running", its store's task answers "which one" — so source
resolves to `task:<definitionId>`, falling back to the identity type. It is an _optional_ DI
dependency, because a project that has not registered background tasks must not make the recorder
unconstructable.

**Scheduled publishing verified, not assumed.** `PublishActionHandler` injects and calls
`PublishEntryUseCase` / `UnpublishEntryUseCase` / `RepublishEntryUseCase`, so a scheduled publish
executing does fire the ordinary entry events and is captured. Scheduling and cancelling still
reach no entry event and remain out of scope.

**`deleteAllForTarget` now reports progress** — `{ finished, deleted }` rather than `void`. The task
has to tell three outcomes apart: finished, more remain, and broken. Collapsing the middle case is
precisely what makes `EmptyTrashBinTaskDefinition` spin, and the purge task's loop is tested against
that: it stops on a stall (work remaining, nothing deleted) rather than retrying forever.

**The tier gate could not be closed.** See the pre-pull-request items; the interim state is a
required `enabled` parameter with no default, so nothing self-registers.

### 3b — the differ

A pure function over two value trees, which is what makes it testable independently of whether the
CMS mints ids.

- Match repeatable-object and dynamic-zone items on stable ids.
- Compare subtree hashes and do not descend when they match.
- Report structural operations at block level without descending into them.
- Compute the longest order-preserving subsequence so inserting one block reports one addition
  rather than a cascade of moves.
- Handle id churn: a new id whose subtree hash matches a disappeared item is the same item, not a
  delete plus an add. This is what stops an import or migration reporting a whole page as replaced.
- Cap the changeset and roll up to the nearest common parent past the cap.

**Permanently required, not a workaround:** id-less values. Even after stable ids land, every entry
written before that point carries no ids until its next save, so the differ needs a defined
behaviour for absent ids and for the absent-to-present transition — which must read as identity
being established, not as wholesale replacement.

### 3b — delivered

143 unit tests passing, build and lint clean.

The differ is parameterised over a `FieldDescriptor` tree rather than over `CmsModel`, so `core/`
still carries no CMS import and every behaviour is testable from hand-written descriptors and
hand-written values. `cms/model/toFieldDescriptors.ts` projects a real model onto it.

```
core/diff/
  descriptors.ts    FieldDescriptor tree, template resolution, label lookup
  contentHash.ts    identity-stripped hashing
  matchItems.ts     three-pass item matching + longest increasing subsequence
  diffValues.ts     the two-tree walk
  rollUp.ts         the cap
```

**Item matching runs in three passes of decreasing confidence** — stable id, then content hash,
then a positional zip. The third pass was not in the brief and is load-bearing on this branch: with
no ids and no content match, editing one item of a list of objects would otherwise report a removal
plus an addition for what was a single edit. Since `next` has no stable ids at all, that is the
ordinary case here, not an edge case. The zip is gated on at least one side lacking an id, so
id-bearing lists stay strict.

**The zip is anchored between confirmed matches, not flat over the leftover sets.** This was a real
defect, caught by review and fixed. A flat zip pairs across the matches that separate the
leftovers: insert a block at the top and edit a different block lower down, and the leftovers are
one original on the left against an inserted item and an edited item on the right. Zipped flat, the
inserted block pairs with the edited block's original — reporting field changes inside something
just inserted, and reporting the block that actually changed as an addition. Right counts, wrong
items, on every list on this branch.

So the confirmed matches partition both lists and leftovers may only pair inside the same gap. Only
the order-preserving backbone of those matches can serve as a boundary, since a match that moved
would produce overlapping gaps. Within one gap nothing distinguishes the candidates — no id, no
equal content — so they pair in order: the counts of edits, additions and removals are right, and
which leftover is "the same item" stays arbitrary, which is the honest position when identity is
absent. Insert-plus-edit and delete-plus-edit with uneven leftovers on both sides are covered by
tests at both the matching and the path level.

**Two interpretations worth confirming, both marked in tests:**

- **A moved block is still descended into.** "Structural operations at block level without
  descending" is applied to additions, removals and template replacements — an added block is one
  entry, not one per field inside it. A moved block exists on both sides, so its move is reported
  _and_ its contents compared: dragging a block and editing it in one save is two things, and a
  reader wants both.
- **The cap keeps the first N entries and collapses the remainder** to their nearest common
  ancestor, labelled from the model. Collapsing rather than dropping is what keeps the record
  honest — the reader is told more changed and where. When the overflow is a single entry its own
  path is its common ancestor, so nothing is summarised away and only `truncated` is set.

**One documented boundary of the churn rule.** It recognises a new id whose _content_ matches
something that disappeared. When content changed too, and both sides carry ids, nothing is left to
match on and the block reports as removed plus added. Reporting it as an edit would mean assuming
position implies identity, which is the assumption stable ids exist to remove. The cost is narrow:
an import that rewrites every id _and_ edits some blocks reports those blocks as replaced.

---

## Checkpoint 4 — publishing workflow activity

**The brief's premises for this checkpoint were void, and confirming them was the instruction that
caught it.** They described APW as it was at 5.44. `packages/api-apw` no longer exists;
`ApwContentReviewContent` has zero occurrences on this branch. APW is now `api-workflows` plus
`api-headless-cms-workflows`, built on a `wbyWorkflowState` private CMS model. Four corrections
follow, and the record shape and action list are written against the verified model rather than
the brief.

**1. One hop, not two.** `targetId` and `targetRevisionId` sit directly on the workflow state, so
reaching the entry needs no traversal through a step. `app` is `cms.<modelId>`, and
`getModelIdFromAppName()` both resolves the model and — by returning null for anything else —
filters non-CMS targets out.

**2. There are events for the review actions.** The brief said there were none.
`workflowState.approveStep`, `.reject`, `.startStep`, `.takeOverStep` and `.cancel` all exist,
alongside `afterCreate` / `afterUpdate` / `afterDelete`.

**3. Capture subscribes to the action events, not to `afterUpdate`** — the opposite of the brief's
mechanism, for reasons verified in the source. `afterUpdate` is published _only_ by
`UpdateWorkflowStateUseCase`, and approve, reject, start and take-over all inject
`UpdateWorkflowStateRepository` directly, bypassing it. Diffing `afterUpdate` would therefore have
missed every step transition — essentially the entire review. It is also redundant where it does
fire: `CancelWorkflowState` goes through the use case, so cancelling publishes both. The action
events are complete: the GraphQL surface is exactly `createWorkflowState`, `startWorkflowStateStep`,
`approveWorkflowStateStep`, `rejectWorkflowStateStep`, `cancelWorkflowState` and
`takeOverWorkflowStateStep`, with no `updateWorkflowState` mutation, so no step state can change
without one of them firing.

**4. Change requests and sign-off are dropped, not approximated.** Both were `api-apw` concepts and
have zero occurrences across `api-workflows`, `app-workflows` and `api-headless-cms-workflows`.
There is nothing to map them onto, so they are absent rather than represented by the nearest
equivalent.

### The action list

Submitted for review, step started, step approved (naming the step), step rejected, step taken
over, review cancelled, review reaching approved or rejected overall, review deleted.

**Step taken over is in deliberately**: it changes who owns a decision mid-review without moving
the step's state, which is exactly the kind of thing someone asks about months later.

**Step started is in because approval does not activate the next step on this branch.**
`WorkflowState.approve()` approves the active step and sets the record state, and nothing more —
picking up the next step is its own action with its own event. Without recording it, a timeline
would jump from one approval to the next with the intervening handover invisible.

**Record-level state is recorded only when terminal.** A non-final approval moves the record to
`pending`, which merely mirrors the step transition and is derivable from it. A terminal `approved`
or `rejected` is different in kind: it is the state that gates publishing, so it is the
governance-relevant fact rather than a derived one.

**One record per meaningful transition.** A final approval still produces two records, as the brief
expected — but for a different reason than it gave. Not because approval activates the next step,
which it does not, but because "this step is approved" and "the review is approved" are two facts.
They share a correlation id.

### Two record-shape additions

- **`subject`** — `{ id, label }`, the part of the target an action concerned. "Step approved" is
  useless without saying which step, and the label is captured at write time so a record stays
  legible after a workflow is reconfigured and its steps renamed.
- **`hasNote`** — a boolean. Steps carry a scalar `comment`, the reviewer's approval or rejection
  note. Its **content is never recorded**: author-written free text about the content is precisely
  what "no content values ever" exists to exclude, and it is the field most likely to hold
  something sensitive. Presence is recorded because a rejection with an explanation and a bare
  rejection are materially different in an audit trail, and presence alone leaks nothing.

### Delivered

389 tests. Seven handlers over a `ReviewActivityRecorder`, plus the coverage guard extended to APW.

**Failure containment was consolidated rather than duplicated.** Both recorders now sit on a shared
`ActivityWriter` that owns actor resolution, source labelling, correlation ids, persistence and the
containment. A second copy of the containment would have been a second chance to forget that a
synchronous throw is not a rejection.

**Website Builder targets are out of scope for this checkpoint and skipped audibly**, with a log
line rather than silently, so the gap reads as a decision instead of as capture that never fires.

**The private-model filter is now asserted, not assumed.** It is load-bearing for two things beyond
noise: activity records are themselves private-model entries, so capturing them would recurse
unboundedly inside a save; and `wbyWorkflowState` is a private model, so capturing it would report
every review transition twice, against the workflow-state entry rather than the entry under
review. Both model ids are named explicitly in the test, imported from the packages that define
them, and the filter carries a boxed comment pointing at it.

---

## Checkpoint 5 — read API

**The authorisation proposal is `plans/entry-activity-log-read-authorisation.md`**, delivered ahead
of any implementation as the brief requires. It covers the two permissions and how they compose,
where they live and how they are named, the tier question, where a field filter would attach, the
delivery API, and what changed paths leak on their own — plus what would be built if approved
unchanged, and the two questions it does not settle.

A GraphQL query for one target: newest first, cursor paginated, filterable by revision and actor.
Takes target type and target id, not entry id.

**Read authorisation gets a written proposal before any implementation.** Two constraints fixed by
the brief: it must not be gated behind the enterprise-only audit logs permission, and the feature
must not assume enterprise-only since business tier is intended.

Store full paths and filter nothing on field permissions — the field permission evaluator returns
`false` unconditionally on `next`, so there is no check to call and the activity log would otherwise
become the product's first field-permission enforcement point. Structure the read path so a filter
can be dropped in when that evaluator is implemented.

---

## Checkpoint 6 — admin UI, plain

A working timeline on the entry form using the design system, with no visual design work — a full
design is coming as a follow-up handover.

Data and presentation cleanly separated: fetching, pagination, filtering and grouping in hooks or
containers; presentation in components that the follow-up can replace outright.

Cover: the grouped timeline, an expanded save, structural changes, review transitions, both
filters, pagination, the empty state, and an entry that predates the feature.

---

## Checkpoint 7 — tests and pull request

- **Differ unit tests** — where the subtle failures live: nested paths, reordering, id churn,
  structural operations, the cap and roll-up, hash determinism, id-less and absent-to-present
  values.
- **Integration tests** across the event set, including the one that matters most: a recorder
  failure never fails a save.
- **APW step diffing tests.**
- **The two coverage guards.**

Run the full pre-commit checklist from `AGENTS.md` before each commit, and note that storage-backed
suites silently skip without a storage flag.

### The pull request description carries the accepted costs

These are decisions, not defects, and they must be visible to a reviewer rather than buried in this
plan or discoverable only from the code.

**1. The stable-id dependency.** Stable item `_id`s do not exist on `next`; PR #5606 is on
`release/6.5.0`, awaiting a forward-merge. State plainly:

- **What is fully tested now:** id matching, id churn, reordering and the longest-order-preserving
  subsequence, all as differ unit tests over synthetic values carrying `_id`. The differ is a pure
  function over two value trees, so none of this waits on the server minting ids.
- **What cannot be integration tested until the forward-merge lands:** end-to-end capture of a
  nested change through a real entry write, because entries on `next` carry no ids for the differ
  to match on. Integration tests assert the id-less path until then.
- **What must be re-run once it lands:** the entry-write integration suite, plus one specific case
  that only becomes reachable then — an entry saved before #5606 and re-saved after it, which
  exercises the absent-to-present transition against real data.

**2. Why absent ids are survivable.** Preserve the reasoning, because it is the load-bearing part:
absent ids are not a temporary condition to be worked around and later deleted. Every entry written
before #5606 carries no ids until its next save, so after the forward-merge the install is a
mixture of id-bearing and id-less entries indefinitely. **The absent-to-present transition must read
as identity being established, never as every item being replaced** — if it reads as replacement,
the first save of every pre-upgrade entry emits a junk record claiming the whole entry was
rewritten, which is the worst possible first impression of the feature. This case gets its own
named differ test.

**3. The private model's read cost.** Measured: the per-entry query reads the entire model on every
page view — 100k items and 202 MB to return 50 records, with page position making no difference at
all, against a Lambda configured with 1 GB and 30 seconds. Accepted knowingly; the narrow storage
interface is the mitigation and the lighter mechanism is the fix.

**4. The OpenSearch write cost.** On a DynamoDB-and-OpenSearch deployment, every activity record
additionally becomes a write to the ES stream table, a stream event, a Lambda invocation and an
indexed OpenSearch document — permanently, for records that are never queried through OpenSearch.
Per-model indexing cannot be disabled: the ddb-es write path has no model-level test, the
`CmsModelOpenSearchIndex` hook returns only settings and a sharing flag with no way to decline, and
the tenant index factory opts private models _in_ by default. This belongs beside the read cost and
not below it, because unlike the read cost it appears on a customer's bill every month rather than
only under load.

**5. `ForceDeleteDecorator`** as a deliberate capture gap.

**6. No persisted hash per changed field — a deliberate departure from the brief.** State the
reasoning, not just the fact, so it can be revisited if revert detection is ever specified: nothing
reads a stored hash across records because an empty changeset already signals a no-op save; a
stored hash leaks a low-cardinality field's new value, which the changeset entry leaks anyway for
the lowest-cardinality fields; and the only consumer that needs persistence is unspecified. Say
plainly that this is a one-way door for records written in the meantime — a hash cannot be computed
retroactively — and that this was accepted. Hashing itself is unaffected and still runs inside the
differ.

**7. The churn rule's boundary.** The rule recognises a new id whose content survived. When content
changed too _and both sides carry ids_, nothing is left to match on and the block reports as
removed plus added. Note the timing explicitly: this limitation only takes effect once stable ids
exist on both sides, so it **arrives with the forward-merge rather than being current behaviour**.
Until then the positional zip covers the same case, because at least one side always lacks an id.

**8. Two interpreters of model structure.** `toFieldDescriptors` reads the model directly rather
than through `ModelToAstConverter`, which needs the GraphQL field-type registry that capture cannot
rely on. The drift risk is covered by an agreement test pinning both to the same field structure on
a representative model, skipped with a warning if the registry ever stops building standalone.

### What is not behind the storage abstraction

The interface makes the _data path_ swappable and the conformance suite proves a replacement
satisfies it. These are the parts that sit outside it and will need work at swap time, listed so
the swap is not costed as though the abstraction covered everything.

- **Private model registration.** `ActivityRecordModel` is a CMS `ModelFactory` registered by
  `ActivityLogAppFeature`. A different store makes it dead weight, but removing it has to be
  sequenced against the records already in it — dropping the registration first orphans them where
  nothing can reach them, since the reader would already be pointed elsewhere.
- **The adapter-private ordering key.** `sequence` exists because this backend needs a unique,
  lexicographically-ordered sort key. A replacement will have its own notion of order and its own
  cursor format; neither is part of the contract, and neither transfers.
- **Deployment and upgrade for the new store.** A dedicated table or index does not exist: it needs
  Pulumi infrastructure, and existing installations need it created on upgrade. There is no
  migration framework on `next`, so records already written to the private model must either be
  moved by a one-off task or knowingly abandoned — and permanent retention means abandoning them
  discards the whole history the feature exists to keep.
- **Chunk sizing in the purge task.** `MAX_DELETE_PASSES` is tuned to a backend whose every page
  costs a full model read. A store with real pagination will want a different bound, and the task's
  timeout budget was chosen against the current cost.
- **Read authorisation.** Not a storage concern in any implementation. Private models set
  `authorization: false`, so the current store enforces nothing, and whatever Checkpoint 5 builds
  must not assume a future store will either.

**9. The cursor fix is a worked example of an already-filed defect.** The offset cursor replaced in
this adapter is the same defect class as the pre-existing entry-list cursor issue filed separately
— `encodeCursor(start + limit)` with `slice(start, end)`, emitted even when the result set is
exhausted. The keyset approach here (a unique, monotonic sort key plus `_lt`, and a cursor returned
only when another page exists) is a worked example for anyone taking that on, on a dataset where
the instability is unmissable rather than intermittent.

**10. The workflow premises were corrected, and the PR should say so.** The brief described APW at
5.44 — `ApwContentReviewContent`, a two-hop path to the entry, no events for review actions, and
change requests and sign-off as first-class concepts. None of that holds on this branch. A reviewer
comparing the code to the brief will otherwise conclude the implementation drifted, when in fact
the brief predated the APW rewrite. State the four corrections and that they were verified in
source, so the PR does not read as though it was built against APW 5.44.

### Pre-pull-request items

Deferred decisions that must be closed before the pull request opens, not carried into it.

- **The tier gate. Blocked, reported at the end of Checkpoint 3a rather than improvised.**

  It was meant to close there, and the reason it cannot is worth recording: **there is no public
  way to gate on a feature-flag name the platform does not already know.** `isEnabled` answers
  _true_ for an unregistered name as long as any licence exists (`LICENSE_CHECKS` rule 6),
  `isExplicitlyDisabled` answers false, and `toDto()` re-derives only the names already in
  `IFeatureFlagsDto`. Every route runs through other packages.

  Closing it needs: `activityLog` in `IFeatureFlagsDto`, `KnownFeatureFlag` and
  `FeatureFlags.toDto()` (`packages/feature-flags`); `canUseActivityLog()` on `ILicense`,
  `License`, `NullLicense` and `ReactLicense` (`packages/wcp`, `packages/app-admin`); an
  `ACTIVITY_LOG` entry in `PROJECT_PACKAGE_FEATURE_NAME`, `WCP_FEATURE_LABEL` and
  `ProjectPackageFeatures` (`packages/wcp`); and the flag added to both `LICENSE_CHECKS` maps
  (`packages/api-core`, `packages/project`). Five packages, and it changes the shape of an
  externally issued licence.

  It also **cannot ever evaluate true until WCP issues `features.activityLog`**, which is outside
  this repository — so the entitlement is a commercial decision as much as a technical one.

  **Interim state, deliberately not a fake gate:** `ActivityLogAppFeature` takes a required
  `enabled` parameter with no default. Nothing registers unless a caller states intent, so the
  feature cannot switch itself on, and the missing wiring is visible at the call site instead of
  hidden behind a lookup that lies.

Then the pull request against `next`, conventional-commit title.

---

## Out of scope

Content values in any form. Model-level change tracking. Website Builder pages, templates, File
Manager versions. Comments. Entry views, locks, exports. A source registry or plugin system. The
two pre-existing defects, filed separately.

**Deferred pending a separate decision:** capturing _scheduling_ an entry and _cancelling_ a
schedule. A scheduled publish executing is already in scope and covered. The two scheduling actions
themselves are not, because neither reaches the target entry as an event — reported in Checkpoint 1
rather than built.

## Carried risks

All accepted rather than solved. Items 1 and 2 go in the pull request description.

1. **The private model's read path.** The storage investigation measured the per-entry query
   reading the entire model on every page view — 100k items and 202 MB to return 50 records, page
   position making no difference — against a 1 GB, 30 second Lambda. The brief accepts this
   knowingly. The narrow interface in Checkpoint 2 is the entire mitigation.
2. **The OpenSearch write cost, permanently, for records never read through OpenSearch.** Each
   activity record on a ddb-es deployment also becomes a stream-table write, a stream event, a
   Lambda invocation and an indexed document. Per-model indexing cannot be turned off — confirmed
   by the storage investigation — and the one dormant `ignore` hook in the stream consumer is dead
   code nothing sets. This is a recurring monthly bill item, not a load-related risk, which is why
   it is reported rather than mitigated.
3. **Stable ids have no test coverage** even on the branch where they exist, and every failure mode
   in that area is silent. See the pull request notes on the dependency.
4. **No migration framework exists on `next`**, so nothing can retrofit records onto existing
   entries and nothing can bootstrap storage on upgrade except a background task. The private model
   itself is code-defined and so appears on upgrade without migration; on ddb-es its index is
   created by the tenant index factory, which enumerates private models by default. If that factory
   does not run on upgrade, writes land on a missing index — worth verifying in Checkpoint 2.

**Explicitly out of scope:** `api-headless-cms-pg-os`. Not benchmarked, not supported, not
considered. See the Checkpoint 1 report for what it is and how mature it looks; it may matter to
the lighter storage mechanism being designed separately, but it is not this build's concern.
