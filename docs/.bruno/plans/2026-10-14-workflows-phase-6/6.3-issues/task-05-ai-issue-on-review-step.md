### Task 5: `AiIssue` and `issues` on review steps

Spec 4.2, 10; D39, D100; R139 (mirror: mapper default, no migration), R171, R176. `ReviewStep` gains `issues: AiIssue[]`: the findings an AI step reports with its decision (a field path, a severity, a message and an optional suggestion). This task only adds the data and its reads; Task 6 makes approve and reject write it, Task 19 produces it. Nothing here changes behaviour of an existing review.

- `domain/review/types.ts`: `type AiIssueSeverity = "error" | "warning" | "info"`; `interface AiIssue { fieldPath: string | null; severity: AiIssueSeverity; message: string; suggestion: string | null }`; `ReviewStep.issues: AiIssue[]` ("The findings of an AI decision, empty for every other step", D39, R171).
- `domain/review/review.model.ts`: step field `issues`, an object list with `fieldPath` (text), `severity` (text), `message` (longText), `suggestion` (longText).
- `features/review/shared/ReviewEntryMapper.ts`: `ReviewEntryStepIssue` and `ReviewEntryStep.issues: ReviewEntryStepIssue[] | null`. `toValues` writes the issues; `fromEntry` reads steps stored before the field existed (`issues` absent or `null`) as `[]` (no migration, R139 mirror) and storage nulls and empty strings of `fieldPath` and `suggestion` as `null`.
- `domain/review/Review.ts`: `Review.request` creates every step with `issues: []`; `Review.restart` resets the step's `issues` to `[]` (a restarted attempt starts clean; R171).
- `features/stepRun/StepRunner/abstractions.ts` (Task 3): `StepRunnerDecisionOutcome.issues` narrows from `unknown[]` to `AiIssue[]` (the contract's final type).
- GraphQL (`graphql/WorkflowsSchemaFactory.ts`): `type WorkflowsAiIssue { fieldPath: String, severity: String!, message: String!, suggestion: String }` and `issues: [WorkflowsAiIssue!]!` on the shared `WorkflowsReviewStep`, between `runs` and `assignments` (R176). The app schemas reuse `WorkflowsReviewStep`, so every app exposes the field with no per-app change. `severity` is a `String`, like `outcome` on `WorkflowsStepRun`.
- Test fixture `createAiIssue` in `__tests__/__helpers/fixtures.ts` (used here and by Task 6).
- **Review step reads stay compatible:** steps written earlier read as `issues: []`; the phase 2-5 review tests that compare whole steps (`ReviewRepository.test.ts`, `attachAssignmentRecords.test.ts`) compare data to data and stay green unchanged.

**Files:**
- Modify: `packages/api-workflows/src/domain/review/types.ts`
- Modify: `packages/api-workflows/src/domain/review/review.model.ts`
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`
- Modify: `packages/api-workflows/src/features/stepRun/StepRunner/abstractions.ts`
- Modify: `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/fixtures.ts`
- Modify: `packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts`
- Modify: `packages/api-workflows/__tests__/review/ReviewRepository.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`
- Create: `packages/api-workflows/__tests__/domain/Review.issues.test.ts`

**Interfaces:**
- Consumes:
  - Existing: `ReviewStep`, `Actor`, `ReviewData` (`~/domain/review/types.js`), `Review.request`, `Review.restart`, `Review.fromData`, `Review.toData` (`~/domain/review/Review.js`), `ReviewEntryMapper.toValues` / `fromEntry`, `ReviewEntryStep`, `ReviewEntryValues` (`~/features/review/shared/ReviewEntryMapper.js`), `StepRunnerDecisionOutcome` (Task 3).
  - Test helpers (phase 5, Task 3): `createRequestedReview`, `toSaveData`, `expectOk`, `NOW`, `requester` (`~tests/__helpers/fixtures.js`), `createFailedAutomationReview`, `AUTOMATION_STEP_ID` (`~tests/__helpers/stepRunReviews.js`), `createContextHandler` (`~tests/__helpers/handler.js`).
- Produces (matches the contract):
  - `AiIssueSeverity`, `AiIssue` (`~/domain/review/types.js`). Consumed by Tasks 6, 17 (`normalizeAiIssues`) and 19.
  - `ReviewStep.issues: AiIssue[]`, always present (`[]` by default). Consumed by Tasks 6 and 19.
  - `WorkflowsAiIssue` and `WorkflowsReviewStep.issues` in the shared GraphQL schema. Consumed by the admin phases.
  - `StepRunnerDecisionOutcome.issues?: AiIssue[]` (Task 3's type, narrowed).
  - Test helper `createAiIssue(overrides?: Partial<AiIssue>): AiIssue` (`~tests/__helpers/fixtures.js`).

- [ ] **Step 1: Write the failing tests**

In `packages/api-workflows/__tests__/__helpers/fixtures.ts`, add `AiIssue` to the existing type import from `~/domain/review/types.js`:

```ts
import type {
    Actor,
    AiIssue,
    ReviewData,
    ReviewPick,
    StepAssignmentResolution,
    TargetContext
} from "~/domain/review/types.js";
```

and append at the end of the file:

```ts
/** One AI finding; override any field. */
export const createAiIssue = (overrides: Partial<AiIssue> = {}): AiIssue => {
    return {
        fieldPath: "seo.title",
        severity: "warning",
        message: "The title is longer than 60 characters.",
        suggestion: "Shorten the title to 60 characters.",
        ...overrides
    };
};
```

Create `packages/api-workflows/__tests__/domain/Review.issues.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Review } from "~/domain/review/Review.js";
import { createAiIssue, createRequestedReview, expectOk, requester } from "~tests/__helpers/fixtures.js";
import {
    AUTOMATION_STEP_ID,
    createFailedAutomationReview,
    createPendingAutomationReview
} from "~tests/__helpers/stepRunReviews.js";

const EVEN_LATER = "2026-10-09T12:00:00.000Z";

describe("ReviewStep.issues on a new review (R171)", () => {
    it("creates every step with no issues", () => {
        const review = createRequestedReview();

        expect(review.toData().steps.map(step => step.issues)).toEqual([[], []]);
    });

    it("creates an automation step with no issues", () => {
        const review = createPendingAutomationReview();

        expect(review.toData().steps.map(step => step.issues)).toEqual([[], []]);
    });
});

describe("Review.restart resets the issues (R171)", () => {
    it("clears the issues of the restarted step and leaves the other steps alone", () => {
        const failed = createFailedAutomationReview();
        const data = failed.toData();
        data.steps[0].issues = [createAiIssue(), createAiIssue({ fieldPath: null, severity: "error" })];
        data.steps[1].issues = [createAiIssue({ message: "Untouched." })];
        const review = Review.fromData(data);

        expectOk(review.restart({ stepId: AUTOMATION_STEP_ID, actor: requester, now: EVEN_LATER }));

        const steps = review.toData().steps;
        expect(steps[0].state).toBe("pending");
        expect(steps[0].issues).toEqual([]);
        expect(steps[1].issues).toEqual([createAiIssue({ message: "Untouched." })]);
    });

    it("keeps an already empty list empty", () => {
        const review = createFailedAutomationReview();

        expectOk(review.restart({ stepId: AUTOMATION_STEP_ID, actor: requester, now: EVEN_LATER }));

        expect(review.toData().steps[0].issues).toEqual([]);
    });
});
```

In `packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts`, change the fixtures import to add `createAiIssue`:

```ts
import { createAiIssue, createRequestedReview, NOW, toSaveData } from "~tests/__helpers/fixtures.js";
```

and append at the end of the file:

```ts
describe("ReviewEntryMapper step issues (R171)", () => {
    it("maps the issues both ways", () => {
        const issues = [
            createAiIssue(),
            createAiIssue({
                fieldPath: null,
                severity: "error",
                message: "The page is empty.",
                suggestion: null
            }),
            createAiIssue({ severity: "info", suggestion: "Keep it." })
        ];
        const data = toSaveData(createRequestedReview());
        data.steps[0].issues = issues;

        const values = ReviewEntryMapper.toValues(data);
        const read = ReviewEntryMapper.fromEntry(toEntry(values));

        expect(values.steps?.[0].issues).toEqual(issues);
        expect(read.steps[0].issues).toEqual(issues);
        expect(read.steps[1].issues).toEqual([]);
    });

    it("does not share the issue objects with the review data", () => {
        const data = toSaveData(createRequestedReview());
        data.steps[0].issues = [createAiIssue()];

        const values = ReviewEntryMapper.toValues(data);
        data.steps[0].issues[0].message = "Changed after mapping.";

        expect(values.steps?.[0].issues?.[0].message).toBe(
            "The title is longer than 60 characters."
        );
    });

    it("reads steps stored without the field, or with null, as no issues (no migration)", () => {
        const values = ReviewEntryMapper.toValues(toSaveData(createRequestedReview()));
        const absent = values.steps?.map(step => ({
            ...step,
            issues: undefined
        })) as unknown as ReviewEntryStep[];
        const nulled = values.steps?.map(step => ({
            ...step,
            issues: null
        })) as unknown as ReviewEntryStep[];

        const readAbsent = ReviewEntryMapper.fromEntry(toEntry({ ...values, steps: absent }));
        const readNull = ReviewEntryMapper.fromEntry(toEntry({ ...values, steps: nulled }));

        expect(readAbsent.steps.map(step => step.issues)).toEqual([[], []]);
        expect(readNull.steps.map(step => step.issues)).toEqual([[], []]);
    });

    it("reads storage nulls and empty strings of the optional fields as null", () => {
        const values = ReviewEntryMapper.toValues(toSaveData(createRequestedReview()));
        const steps = values.steps?.map((step, index) =>
            index === 0
                ? {
                      ...step,
                      issues: [
                          {
                              fieldPath: "",
                              severity: "error",
                              message: "Broken.",
                              suggestion: ""
                          },
                          {
                              fieldPath: null,
                              severity: "info",
                              message: "Fine.",
                              suggestion: null
                          }
                      ]
                  }
                : step
        ) as ReviewEntryStep[];

        const read = ReviewEntryMapper.fromEntry(toEntry({ ...values, steps }));

        expect(read.steps[0].issues).toEqual([
            { fieldPath: null, severity: "error", message: "Broken.", suggestion: null },
            { fieldPath: null, severity: "info", message: "Fine.", suggestion: null }
        ]);
    });
});
```

In `packages/api-workflows/__tests__/review/ReviewRepository.test.ts`, add `createAiIssue` to the fixtures import (alphabetical position, after `ARTICLE_MODEL`):

```ts
import {
    ARTICLE_MODEL,
    createAiIssue,
    createRequestedReview,
    createWorkflow,
    expectOk,
    NOW,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
```

and add this test directly after `it("round-trips the task id and the earlier runs of a step", ...)`:

```ts
    it("round-trips the issues of a step and reads other steps as no issues (R171)", async () => {
        const repository = await createRepository();
        const base = toSaveData(createRequestedReview());
        const issues = [
            createAiIssue(),
            createAiIssue({
                fieldPath: null,
                severity: "error",
                message: "The page has no content.",
                suggestion: null
            }),
            createAiIssue({ fieldPath: "fields.body.0.text", severity: "info" })
        ];
        const data = {
            ...base,
            steps: base.steps.map((step, index) => (index === 0 ? { ...step, issues } : step))
        };

        const saved = await repository.save(data);
        const read = await repository.get(data.id);

        expect(saved.value.steps[0].issues).toEqual(issues);
        expect(read.value.steps[0].issues).toEqual(issues);
        expect(read.value.steps[1].issues).toEqual([]);
    });
```

In `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`, in the `"exposes the shared types the app schemas reuse (R100)"` test, add `"issues"` after `"runs"` in the `WorkflowsReviewStep` list and the new type assertion after the `WorkflowsStepRun` one:

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
            "issues",
            "assignments"
        ]);
        expect(memberNames(types, "WorkflowsStepRun")).toEqual([
            "taskId",
            "startedOn",
            "finishedOn",
            "outcome",
            "reason"
        ]);
        expect(memberNames(types, "WorkflowsAiIssue")).toEqual([
            "fieldPath",
            "severity",
            "message",
            "suggestion"
        ]);
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
yarn test packages/api-workflows/__tests__/domain/Review.issues.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewRepository.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/domain/Review.issues.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ReviewRepository.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
```

Expected: FAIL on both storages. `Review.issues.test.ts`: `step.issues` is `undefined` (expected `[[], []]`); `ReviewEntryMapper.test.ts` and `ReviewRepository.test.ts`: the issues read back `undefined` / `[]` where the saved ones are expected; `workflowsSchema.test.ts`: `WorkflowsReviewStep` has no `issues` member and `WorkflowsAiIssue` is not a type (`[]`).

- [ ] **Step 3: Write the implementation**

In `packages/api-workflows/src/domain/review/types.ts`, add the issue types after `ReviewStepRun` and the field on `ReviewStep`:

```ts
export type AiIssueSeverity = "error" | "warning" | "info";

/**
 * One finding of an AI decision (D39, R171). `fieldPath` is a dotted path into the target
 * (`null` when the finding is about the whole target); `suggestion` is an optional fix.
 */
export interface AiIssue {
    fieldPath: string | null;
    severity: AiIssueSeverity;
    message: string;
    suggestion: string | null;
}

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
    /** The findings of an AI decision; empty for every other step and before a decision (R171). */
    issues: AiIssue[];
}
```

In `packages/api-workflows/src/domain/review/review.model.ts`, add the `issues` field after `runs` (inside the `steps` `.fields(stepFields => ({ ... }))` block; `runs` becomes followed by a comma):

```ts
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
                                })),
                            issues: stepFields
                                .object()
                                .label("Issues")
                                .list()
                                .fields(issueFields => ({
                                    fieldPath: issueFields.text().label("Field path"),
                                    severity: issueFields.text().label("Severity"),
                                    message: issueFields.longText().label("Message"),
                                    suggestion: issueFields.longText().label("Suggestion")
                                }))
                        })),
```

In `packages/api-workflows/src/domain/review/Review.ts`, in `Review.request` the step literal gains `issues: []` after `runs: []`:

```ts
            taskId: null,
            runs: [],
            issues: []
        }));
```

and `Review.restart` resets it (add the line after `step.taskId = null;`):

```ts
        step.state = "pending";
        step.comment = null;
        step.taskId = null;
        step.issues = [];
        step.reachedOn = null;
        step.startedOn = null;
        step.finishedOn = null;
```

In `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`:

Add `AiIssue` and `AiIssueSeverity` to the type import from `~/domain/review/types.js`:

```ts
import type {
    AiIssue,
    AiIssueSeverity,
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

Add the entry type after `ReviewEntryStepRun` and the field on `ReviewEntryStep`:

```ts
export interface ReviewEntryStepIssue {
    fieldPath: string | null;
    severity: string;
    message: string;
    suggestion: string | null;
}
```

```ts
    taskId: string | null;
    runs: ReviewEntryStepRun[] | null;
    issues: ReviewEntryStepIssue[] | null;
}
```

In `stepToEntry`, after the `runs` mapping:

```ts
            runs: step.runs.map(run => ({
                taskId: run.taskId,
                startedOn: run.startedOn,
                finishedOn: run.finishedOn,
                outcome: run.outcome,
                reason: run.reason
            })),
            issues: step.issues.map((issue: AiIssue) => ({
                fieldPath: issue.fieldPath,
                severity: issue.severity,
                message: issue.message,
                suggestion: issue.suggestion
            }))
        };
```

In `stepFromEntry`, after the `runs` mapping:

```ts
            runs: (step.runs ?? []).map(run => ({
                taskId: run.taskId || null,
                startedOn: toIsoString(run.startedOn) ?? "",
                finishedOn: toIsoString(run.finishedOn),
                // Only the engine writes this model, always with a `StepRunOutcome`.
                outcome: (run.outcome as StepRunOutcome | null) || null,
                reason: run.reason || null
            })),
            // Reviews stored before the field existed read as no issues (R171, like R139).
            issues: (step.issues ?? []).map(
                (issue): AiIssue => ({
                    fieldPath: issue.fieldPath || null,
                    // Only the engine writes this model, always with an `AiIssueSeverity`.
                    severity: issue.severity as AiIssueSeverity,
                    message: issue.message ?? "",
                    suggestion: issue.suggestion || null
                })
            )
        };
```

In `packages/api-workflows/src/features/stepRun/StepRunner/abstractions.ts`, import `AiIssue` and narrow the outcome. Replace the first import and the `StepRunnerDecisionOutcome` declaration:

```ts
import type { Actor, AiIssue, ReviewData, ReviewStep } from "~/domain/review/types.js";

/**
 * `approved` and `rejected` end the step; a `rejected` outcome needs a comment of 10 or more
 * characters after trimming (D100). `issues` are the AI findings stored on the step (R171).
 */
export interface StepRunnerDecisionOutcome {
    type: "approved" | "rejected";
    comment?: string;
    issues?: AiIssue[];
}
```

In `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts`, add the type before `WorkflowsReviewStep` (after `WorkflowsStepRun`) and the field after `runs`:

```graphql
    type WorkflowsAiIssue {
        "A dotted path into the target; null when the finding is about the whole target."
        fieldPath: String
        "error, warning or info."
        severity: String!
        message: String!
        suggestion: String
    }

    type WorkflowsReviewStep {
        ...
        "Earlier attempts of the step, oldest first (D82)."
        runs: [WorkflowsStepRun!]!
        "The findings of an AI decision (R171); empty for every other step."
        issues: [WorkflowsAiIssue!]!
        "Assignment-log entries of this step, newest first (D127). Only on a single review read; skip entries need editor or reassign (D89)."
        assignments: [WorkflowsAssignmentEntry!]
    }
```

(The `...` stands for the unchanged fields of `WorkflowsReviewStep`; only the two shown blocks change.)

- [ ] **Step 4: Run the tests to verify they pass**

```bash
yarn test packages/api-workflows/__tests__/domain/Review.issues.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewRepository.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/domain/Review.issues.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ReviewEntryMapper.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ReviewRepository.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50
```

Expected: PASS on both storages.

- [ ] **Step 5: Run the existing tests that cover the changed code**

These must stay green unchanged (the new field defaults to `[]` and every comparison is data against data or `toMatchObject`). Run each file on both storages (`yarn test` and `yarn test:os`, one `test:os` at a time):

```bash
yarn test packages/api-workflows/__tests__/domain/Review.request.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/domain/Review.stepRun.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/domain/Review.decisions.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/RestartReviewStep.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/assignment/attachAssignmentRecords.test.ts 2>&1 | tail -50
yarn test packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/domain/Review.request.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/domain/Review.stepRun.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/domain/Review.decisions.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/RestartReviewStep.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/assignment/attachAssignmentRecords.test.ts 2>&1 | tail -50
yarn test:os packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskDispatch.test.ts 2>&1 | tail -50
yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40
```

Expected: PASS; the type check prints no errors (it proves no `ReviewStep` literal in the package tests is missing `issues`, and that `StepRunnerDecisionOutcome.issues` accepts `AiIssue[]`).

- [ ] **Step 6: Pre-commit chain and commit**

Run the pre-commit chain from the Global Constraints for `@webiny/api-workflows` (`yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`), then:

```bash
git add .
git commit -m "feat(api-workflows): add AI issues to review steps" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```
