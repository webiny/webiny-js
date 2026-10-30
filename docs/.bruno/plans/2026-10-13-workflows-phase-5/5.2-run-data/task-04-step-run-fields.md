### Task 4: `taskId` and `runs` on review steps

Spec 5.1, 7.4; D57, D82; R139, R158; A52. Every review step carries the id of its current background task and the history of its earlier attempts. Nothing writes either yet (Task 5 does); this task adds the data, its storage mapping and its GraphQL shape:

- `ReviewStep.taskId: string | null`: the current attempt's background task id, also the run id. `null` for every review step (they have no task) and for an automation step that has not started a task. `ReviewStep.runs: ReviewStepRun[]`: earlier attempts only, oldest first, `[]` until a restart (Task 5).
- `ReviewStepRun { taskId: string | null; startedOn: string; finishedOn: string | null; outcome: StepRunOutcome | null; reason: string | null }`, `StepRunOutcome = "approved" | "rejected" | "failed"`. `taskId` is `null` on a run whose reach failed before a task started (R139).
- `Review.request` creates every step with `taskId: null`, `runs: []`.
- Storage: `taskId` (text) and `runs` (object list: `taskId` text, `startedOn` datetime without timezone, `finishedOn` datetime without timezone, `outcome` text, `reason` long text) on the step object of the `wbyWorkflowReview` model. No migration (R139): `ReviewEntryMapper.stepFromEntry` reads a missing `taskId` as `null` and missing `runs` as `[]`, so reviews written before this task read as `taskId: null`, `runs: []`.
- GraphQL: type `WorkflowsStepRun { taskId: String, startedOn: DateTime!, finishedOn: DateTime, outcome: String, reason: String }`; `taskId: String` and `runs: [WorkflowsStepRun!]!` on the shared `WorkflowsReviewStep` type, which CMS and WB reuse (R158), so the app tasks add no step fields. Resolution is the default property read on `ReviewData` steps, so no resolver changes.

Test fixtures do not build `ReviewStep` literals (they go through `Review.request`), so no fixture changes; the one literal-based test (`ReviewRepository.test.ts`, "round-trips every field") spreads real steps and keeps passing.

**Files:**
- Modify: `packages/api-workflows/src/domain/review/types.ts`
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/src/domain/review/review.model.ts`
- Modify: `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Modify: `packages/api-workflows/__tests__/domain/Review.request.test.ts`
- Modify: `packages/api-workflows/__tests__/review/ReviewRepository.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
- Create: `packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts`

**Interfaces:**
- Consumes (existing): `ReviewStep`, `ReviewData` (`~/domain/review/types.js`); `Review.request`; `ReviewEntryMapper.toValues` / `fromEntry` and `ReviewEntryStep` (`~/features/review/shared/ReviewEntryMapper.js`); `toIsoString(value: unknown): string | null` (`~/features/shared/toIsoString.js`); `ReviewRepository.save` / `get`; `createRequestedReview`, `toSaveData`, `NOW` (`~tests/__helpers/fixtures.js`); `createContextHandler` (`~tests/__helpers/handler.js`).
- Produces:
  - `type StepRunOutcome = "approved" | "rejected" | "failed"` and `interface ReviewStepRun { taskId: string | null; startedOn: string; finishedOn: string | null; outcome: StepRunOutcome | null; reason: string | null }` (`~/domain/review/types.js`); `ReviewStep.taskId: string | null`, `ReviewStep.runs: ReviewStepRun[]`.
  - `ReviewEntryStepRun { taskId: string | null; startedOn: string | Date | null; finishedOn: string | Date | null; outcome: string | null; reason: string | null }` and `ReviewEntryStep.taskId: string | null`, `ReviewEntryStep.runs: ReviewEntryStepRun[] | null` (`~/features/review/shared/ReviewEntryMapper.js`).
  - GraphQL `WorkflowsStepRun`, `WorkflowsReviewStep.taskId`, `WorkflowsReviewStep.runs`.
  - Consumed by Tasks 5, 9, 10, 11, 12, 14, 15, 16, 17.

- [ ] **Step 1: Write the failing tests**

In `packages/api-workflows/__tests__/domain/Review.request.test.ts`, inside `describe("Review.request", ...)`, add after the test `"stores picks on the matching steps"`:

```ts
    it("creates every step without a task id and without earlier runs", () => {
        const review = requestReview();

        const steps = review.toData().steps;

        expect(steps.map(step => step.taskId)).toEqual([null, null]);
        expect(steps.map(step => step.runs)).toEqual([[], []]);
    });
```

In `packages/api-workflows/__tests__/review/ReviewRepository.test.ts`, add after the test `"round-trips every field, including nullables, owners and assignments"`:

```ts
    it("round-trips the task id and the earlier runs of a step", async () => {
        const repository = await createRepository();
        const base = toSaveData(createRequestedReview());
        const runs = [
            {
                taskId: "task-1",
                startedOn: NOW,
                finishedOn: LATER,
                outcome: "failed" as const,
                reason: "The automation failed: boom."
            },
            {
                taskId: null,
                startedOn: LATER,
                finishedOn: LATER,
                outcome: "failed" as const,
                reason: 'The automation "test-automation" is not available.'
            },
            {
                taskId: "task-2",
                startedOn: LATER,
                finishedOn: null,
                outcome: null,
                reason: null
            }
        ];
        const data = {
            ...base,
            steps: base.steps.map((step, index) =>
                index === 0 ? { ...step, taskId: "task-3", runs } : step
            )
        };

        const saved = await repository.save(data);
        const read = await repository.get(data.id);

        expect(saved.value.steps[0].taskId).toBe("task-3");
        expect(saved.value.steps[0].runs).toEqual(runs);
        expect(read.value.steps[0].taskId).toBe("task-3");
        expect(read.value.steps[0].runs).toEqual(runs);
        // The untouched second step keeps no task and no runs.
        expect(read.value.steps[1]).toMatchObject({ taskId: null, runs: [] });
    });
```

Create `packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import {
    ReviewEntryMapper,
    type ReviewEntryStep,
    type ReviewEntryValues
} from "~/features/review/shared/ReviewEntryMapper.js";
import type { ReviewStepRun } from "~/domain/review/types.js";
import { createRequestedReview, NOW, toSaveData } from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

const toEntry = (values: ReviewEntryValues): CmsEntry<ReviewEntryValues> => {
    return {
        id: "review-1#0001",
        createdOn: NOW,
        savedOn: LATER,
        values
    } as unknown as CmsEntry<ReviewEntryValues>;
};

describe("ReviewEntryMapper step run data (R139)", () => {
    it("maps the task id and the runs both ways", () => {
        const runs: ReviewStepRun[] = [
            {
                taskId: "task-1",
                startedOn: NOW,
                finishedOn: LATER,
                outcome: "failed",
                reason: "The automation failed: boom."
            },
            {
                taskId: null,
                startedOn: LATER,
                finishedOn: null,
                outcome: null,
                reason: null
            }
        ];
        const data = toSaveData(createRequestedReview());
        data.steps[0].taskId = "task-2";
        data.steps[0].runs = runs;

        const values = ReviewEntryMapper.toValues(data);
        const read = ReviewEntryMapper.fromEntry(toEntry(values));

        expect(values.steps?.[0].taskId).toBe("task-2");
        expect(values.steps?.[0].runs).toEqual(runs);
        expect(read.steps[0].taskId).toBe("task-2");
        expect(read.steps[0].runs).toEqual(runs);
        expect(read.steps[1]).toMatchObject({ taskId: null, runs: [] });
    });

    it("reads steps stored without the fields as no task and no runs (no migration)", () => {
        const values = ReviewEntryMapper.toValues(toSaveData(createRequestedReview()));
        const legacySteps = values.steps?.map(step => ({
            ...step,
            taskId: undefined,
            runs: undefined
        })) as unknown as ReviewEntryStep[];

        const read = ReviewEntryMapper.fromEntry(toEntry({ ...values, steps: legacySteps }));

        expect(read.steps.map(step => step.taskId)).toEqual([null, null]);
        expect(read.steps.map(step => step.runs)).toEqual([[], []]);
    });

    it("reads storage dates as ISO strings and storage nulls as null", () => {
        const values = ReviewEntryMapper.toValues(toSaveData(createRequestedReview()));
        const steps = values.steps?.map((step, index) =>
            index === 0
                ? {
                      ...step,
                      taskId: "",
                      runs: [
                          {
                              taskId: "",
                              startedOn: new Date(NOW),
                              finishedOn: new Date(LATER),
                              outcome: "",
                              reason: ""
                          }
                      ]
                  }
                : step
        ) as ReviewEntryStep[];

        const read = ReviewEntryMapper.fromEntry(toEntry({ ...values, steps }));

        expect(read.steps[0].taskId).toBeNull();
        expect(read.steps[0].runs).toEqual([
            { taskId: null, startedOn: NOW, finishedOn: LATER, outcome: null, reason: null }
        ]);
    });
});
```

In `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`, in the `WorkflowsReviewStep` expectation, add `"taskId"` and `"runs"` after `"finishedOn"`:

```ts
        expect(memberNames(types, "WorkflowsReviewStep")).toEqual([
            ...stepFields,
            "state",
            "owner",
            "comment",
            "pickedUserId",
            "candidateTeamIds",
            "assignmentSource",
            "assignment",
            "reachedOn",
            "startedOn",
            "finishedOn",
            "taskId",
            "runs",
            "assignments"
        ]);
        expect(memberNames(types, "WorkflowsStepRun")).toEqual([
            "taskId",
            "startedOn",
            "finishedOn",
            "outcome",
            "reason"
        ]);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.request.test.ts packages/api-workflows/__tests__/review/ReviewRepository.test.ts packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: FAIL. `Review.request.test.ts`: `steps.map(step => step.taskId)` is `[undefined, undefined]`, not `[null, null]`. `ReviewRepository.test.ts` and `ReviewEntryMapper.test.ts`: `taskId` and `runs` are `undefined` (the mapper drops them, the model has no such fields). `workflowsSchema.test.ts`: the `WorkflowsReviewStep` member list lacks `taskId` and `runs`, and `WorkflowsStepRun` is `[]`. (Type errors on the new fields are not reported by vitest.)

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/domain/Review.request.test.ts packages/api-workflows/__tests__/review/ReviewRepository.test.ts packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: the same failures.

- [ ] **Step 3: The domain types and the aggregate**

In `packages/api-workflows/src/domain/review/types.ts`, add after the `ReviewStepAssignment` interface and before `ReviewStep`:

```ts
/** How an earlier attempt of a step ended (D82). */
export type StepRunOutcome = "approved" | "rejected" | "failed";

/**
 * One earlier attempt of a step (D82, R139): the history `Review.restart` appends the failed
 * attempt to. `taskId` is `null` when the reach failed before a task started.
 */
export interface ReviewStepRun {
    taskId: string | null;
    startedOn: string;
    finishedOn: string | null;
    outcome: StepRunOutcome | null;
    reason: string | null;
}
```

and change `ReviewStep` to:

```ts
export interface ReviewStep extends WorkflowStep {
    state: StepState;
    owner: Actor | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[];
    assignmentSource: AssignmentSource | null;
    assignment: ReviewStepAssignment | null;
    reachedOn: string | null;
    startedOn: string | null;
    finishedOn: string | null;
    /** The current attempt's background task id, also the run id (D57, R139). */
    taskId: string | null;
    /** Earlier attempts, oldest first (D82, R139). */
    runs: ReviewStepRun[];
}
```

In `packages/api-workflows/src/domain/review/Review.ts`, in `Review.request`, the step literal becomes:

```ts
        const steps = params.workflow.steps.map((step): ReviewStep => ({
            ...structuredClone(step),
            state: "pending",
            owner: null,
            comment: null,
            pickedUserId: picks.get(step.id) ?? null,
            candidateTeamIds: [],
            assignmentSource: null,
            assignment: null,
            reachedOn: null,
            startedOn: null,
            finishedOn: null,
            taskId: null,
            runs: []
        }));
```

- [ ] **Step 4: The storage model and the mapper**

In `packages/api-workflows/src/domain/review/review.model.ts`, inside the `steps` object fields, replace the last three lines of the step fields (`reachedOn`, `startedOn`, `finishedOn`) with:

```ts
                            reachedOn: stepFields.datetime().label("Reached on").withoutTimezone(),
                            startedOn: stepFields.datetime().label("Started on").withoutTimezone(),
                            finishedOn: stepFields.datetime().label("Finished on").withoutTimezone(),
                            taskId: stepFields.text().label("Task ID"),
                            runs: stepFields
                                .object()
                                .label("Runs")
                                .list()
                                .fields(runFields => ({
                                    taskId: runFields.text().label("Task ID"),
                                    startedOn: runFields
                                        .datetime()
                                        .label("Started on")
                                        .withoutTimezone(),
                                    finishedOn: runFields
                                        .datetime()
                                        .label("Finished on")
                                        .withoutTimezone(),
                                    outcome: runFields.text().label("Outcome"),
                                    reason: runFields.longText().label("Reason")
                                }))
```

In `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`:

1. Add `StepRunOutcome` to the type import from `~/domain/review/types.js` (keep the list alphabetical):

```ts
import type {
    ReviewData,
    ReviewState,
    ReviewStep,
    ReviewStepAssignment,
    StepRunOutcome,
    StepState,
    TargetContextAuthor,
    TargetContextFolder
} from "~/domain/review/types.js";
```

2. Add the run entry type after `ReviewEntryStepAssignment` and extend `ReviewEntryStep`:

```ts
export interface ReviewEntryStepRun {
    taskId: string | null;
    startedOn: string | Date | null;
    finishedOn: string | Date | null;
    outcome: string | null;
    reason: string | null;
}

export interface ReviewEntryStep {
    id: string;
    title: string;
    color: string | null;
    description: string | null;
    type: string;
    notifications: WorkflowStepNotification[] | null;
    config: unknown;
    state: string;
    owner: ActorEntryValues | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[] | null;
    assignmentSource: string | null;
    assignment: ReviewEntryStepAssignment | null;
    reachedOn: string | Date | null;
    startedOn: string | Date | null;
    finishedOn: string | Date | null;
    taskId: string | null;
    runs: ReviewEntryStepRun[] | null;
}
```

3. In `stepToEntry`, end the returned object with:

```ts
            reachedOn: step.reachedOn,
            startedOn: step.startedOn,
            finishedOn: step.finishedOn,
            taskId: step.taskId,
            runs: step.runs.map(run => ({
                taskId: run.taskId,
                startedOn: run.startedOn,
                finishedOn: run.finishedOn,
                outcome: run.outcome,
                reason: run.reason
            }))
        };
```

4. In `stepFromEntry`, end the returned object with (reviews stored before the fields existed read as no task and no runs, R139):

```ts
            reachedOn: toIsoString(step.reachedOn),
            startedOn: toIsoString(step.startedOn),
            finishedOn: toIsoString(step.finishedOn),
            // Reviews stored before the fields existed read as no task and no runs (R139).
            taskId: step.taskId || null,
            runs: (step.runs ?? []).map(run => ({
                taskId: run.taskId || null,
                startedOn: toIsoString(run.startedOn) ?? "",
                finishedOn: toIsoString(run.finishedOn),
                // Only the engine writes this model, always with a `StepRunOutcome`.
                outcome: (run.outcome as StepRunOutcome | null) || null,
                reason: run.reason || null
            }))
        };
```

- [ ] **Step 5: The GraphQL shape**

In `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`, add the run type before `type WorkflowsReviewStep {`:

```graphql
    type WorkflowsStepRun {
        "The earlier attempt's background task id; null when its reach failed before a task started."
        taskId: String
        startedOn: DateTime!
        finishedOn: DateTime
        "approved, rejected or failed."
        outcome: String
        reason: String
    }

```

and in `type WorkflowsReviewStep`, after `finishedOn: DateTime` and before the `assignments` description line, add:

```graphql
        "The current attempt's background task id (D57); null on a review step and before an automation starts."
        taskId: String
        "Earlier attempts of the step, oldest first (D82)."
        runs: [WorkflowsStepRun!]!
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.request.test.ts packages/api-workflows/__tests__/review/ReviewRepository.test.ts packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/domain/Review.request.test.ts packages/api-workflows/__tests__/review/ReviewRepository.test.ts packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: PASS.

Also run the existing files that read or write reviews through the changed model and mapper: `yarn test packages/api-workflows/__tests__/review/ReviewRepositoryList.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/review/RequestReview.test.ts packages/api-workflows/__tests__/domain/Review.reassign.test.ts 2>&1 | tail -50`, then the same four with `yarn test:os` (one run at a time). Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows|background-tasks" | head`
Expected: no output.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the task id and the earlier runs to review steps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
