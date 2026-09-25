# Plan: AI summaries for entry activity records

**Worktree:** `/Users/svenalhamad/Dev/webiny-activity-summaries`
**Branch:** `feat/entry-activity-log-ai-summaries`, from `feat/entry-activity-log` @ `0178333705`
**Merge:** `origin/next` @ `5d42228483` merged in as `648c0efdf6`
**Design:** `activity-log-ai-summaries-design.md`
**Investigations:** `entry-activity-log-ai-summaries-investigation.md`,
`entry-activity-log-summary-debouncing-investigation.md`

Eight checkpoints. Each ends with a report and waits for confirmation.

---

## Checkpoint 1 — worktree, verification, plan (this document)

Complete. Verification results and contradictions are in the accompanying report.

The significant finding: `#5728` landed on `next` the day before this brief and **closes the tier
gate's plumbing**, which both the design and the brief treat as open. That changes Checkpoint 6's
per-installation switch from an open question into a wiring job, and it is the first thing to settle
before Checkpoint 2 fixes a record shape around it.

---

## Checkpoint 2 — storage and record shape

`ActivityRecord` gains three optional fields: `summary`, the transient value bundle, and job state
(task id, pending/settled, and a settled reason that is never exposed to readers).

Two operations on `ActivityLogStorage`, taking it from three to five:

- Set summary and clear the bundle for one record, in one write. Idempotent, must not touch
  `sequence`, does nothing when the record is gone.
- Find records carrying a bundle older than a threshold, across targets, for the sweeper.

**Files**

- `packages/api-activity-log/src/core/types.ts` — record shape
- `packages/api-activity-log/src/core/abstractions.ts` — two operations
- `packages/api-activity-log/src/storage/privateModel/ActivityRecordModel.ts` — model fields
- `packages/api-activity-log/src/storage/privateModel/ActivityRecordMapper.ts` — mapping
- `packages/api-activity-log/src/storage/privateModel/PrivateModelActivityLogStorage.ts` — both ops
- `packages/api-activity-log/__tests__/conformance/storageConformance.ts` — cases, including that an
  update does not move a record under the keyset cursor and that a swept record still lists

---

## Checkpoint 3 — routing, dispatch and debounce

All inside `EntryActivityRecorder`, therefore inside `ActivityWriter`'s containment.

The routing rule, the value bundle and its ceiling, then dispatch with the previous-record debounce.

**Open problem to solve here, not currently solvable:** the routing rule needs "free-text paths
changed", and `FieldKind` is `"scalar" | "object" | "dynamicZone"` only
(`core/diff/descriptors.ts:13`) — every scalar type collapses to one kind, so text cannot be told
from boolean. The recorder holds the `CmsModel`, so the CMS field type is reachable; the fix is
either carrying the type onto `FieldDescriptor` or resolving it at routing time. Decide and report.

**Files**

- `packages/api-activity-log/src/cms/summary/` — new: routing rule, bundle builder, debounce
- `packages/api-activity-log/src/cms/recorder/EntryActivityRecorder.ts` — call the dispatcher
- `packages/api-activity-log/src/cms/model/toFieldDescriptors.ts` — field type, if that route wins
- `packages/api-activity-log/src/core/diff/descriptors.ts` — ditto
- `packages/api-activity-log/__tests__/capture/` — routing, debounce, containment-by-breaking

---

## Checkpoint 4 — the job

An AI Powerups capability plus a background task that reads a record id, resolves the capability,
generates prose, and writes it back while clearing the bundle.

**Files**

- `packages/api-activity-log/src/cms/summary/capability.ts` — `AiCapability.createImplementation`,
  `defaultRole: "fast"`, guidance text
- `packages/api-activity-log/src/cms/summary/SummariseActivityTaskDefinition.ts` — metadata plus
  handler, following the split the task system now requires
- `packages/api-activity-log/src/cms/summary/feature.ts` — registration
- `packages/api-activity-log/package.json` — `@webiny/ai-powerups` dependency

---

## Checkpoint 5 — the sweeper

A scheduled task clearing abandoned bundles, using the age query from Checkpoint 2. Modelled on the
purge task from PR #5682, including its stall detection, not on `EmptyTrashBinTask`.

**Files**

- `packages/api-activity-log/src/cms/summary/SweepStaleBundlesTaskDefinition.ts`
- `packages/api-activity-log/src/cms/summary/feature.ts` — registration and schedule

---

## Checkpoint 6 — the read path

The deterministic description, the inert suppression hook, GraphQL exposure, and the
per-installation switch.

**The deterministic description already exists.** `describeAction`
(`app-activity-log/src/timeline/describeAction.ts`) produces the editorial sentence today and covers
structural changes, counts and every non-content action. This checkpoint enriches it to name a
single changed field rather than counting it — it does not build a new module.

**Files**

- `packages/app-activity-log/src/timeline/describeAction.ts` — enrich
- `packages/api-activity-log/src/features/listActivity/abstractions.ts` — suppression hook
- `packages/api-activity-log/src/features/listActivity/ListActivityUseCase.ts` — apply it
- `packages/api-activity-log/src/graphql/ActivityLogGraphQLFactory.ts` — expose summary and pending
- `packages/api-activity-log/src/ActivityLogAppFeature.ts` — the switch

---

## Checkpoint 7 — admin UI, plain

Pending versus settled, on the collapsed row, with the run's summary above the per-save
descriptions when expanded.

**Files**

- `packages/app-activity-log/src/timeline/types.ts`, `summariseItem.ts` — carry summary and pending
- `packages/app-activity-log/src/components/ActivityTimeline.tsx` — render
- `packages/app-activity-log/src/gateway/ActivityLogGateway.ts` — query the new fields
- `packages/app-activity-log/__tests__/states.test.tsx` — extend, do not add a suite

---

## Checkpoint 8 — tests and pull request

Unit tests for every routing branch and each cap boundary; debounce tests including a revision
boundary not collapsing; integration tests for dispatch inside the write verified by breaking
containment, a job whose record is gone, a job beaten by a later save, and the sweeper.

Then the PR, with one section carrying the accepted costs, per the PR #5682 convention.

---

## Carried risks

1. **The path cap conflict.** The brief asks for a default of 30 _and_ for reuse of the roll-up
   constant, which is `DEFAULT_MAX_ENTRIES = 100` (`core/diff/rollUp.ts:12`). These are different
   numbers answering different questions. Resolved at Checkpoint 3.
2. **Free-text classification** is not currently derivable from the changeset. See Checkpoint 3.
3. **The tier gate is no longer open.** Checkpoint 6's switch and the gate should be settled
   together rather than the switch being invented alongside a gate that now exists.
4. **`ddb-es` indexes the transient bundle.** Unavoidable while storage is a private CMS model;
   bounded by the sweeper and answered completely by the per-installation switch.
