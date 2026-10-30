### Task 8: Test setup, domain, DTOs, fragments, mappers, interfaces

Spec 13.1 and 13.4 (client core); R202 (shared core in `app-workflows`, app-owned gateways), R204 (the gateway returns envelopes, the shared use cases throw), R213 (`REVIEW_SYSTEM_WORKFLOW_SELECTION`, `toSystemWorkflow`, `IReviewCacheWriter`), R218 (`allowManualPick`), R222 (test setup for a package without tests), R224 (`IReviewContentAdapter`), R234 (`ReviewListRow` is private presenter state); A75 (this task proves the test setup in `app-workflows`); Q7 (`candidateTeams`, selected in the fragments). Everything here is pure types, constants and pure functions. No DI token lives in `app-workflows` for the gateway or the use cases (R202): each app creates its own tokens in Tasks 11 and 12 over the interfaces defined here.

- `packages/app-workflows` gets its first vitest setup (a copy of `packages/app-admin/vitest.config.ts`, jsdom) and `vitest` as a devDependency. Every test in 8a.3 is co-located (`*.test.ts` next to the file under test). `@webiny/di` is added in Task 9 and `@testing-library/react` in Task 10, the first tasks that import them (see Contract notes).
- `review/domain/` holds the enums (`ReviewState`, `StepState`), the list kind and sort unions, the error code table (`ReviewErrorCode`, mirror of `packages/api-workflows/src/domain/review/errors.ts`), the constants and the plain domain interfaces (`types.ts`). Three pure functions, one per file: `toReviewListRow`, `toSystemWorkflow` (mirror of `Review.getSystemWorkflow()` and `findCurrentStep()` in `packages/api-workflows/src/domain/review/Review.ts`: `null` for a cancelled or missing review, current step = the first step that is not approved, else the last step, review state derived from that step) and `isReviewSelectable` (true for no review state and for `approved`).
- `review/gateway/` holds the DTO types of the shared `Workflows*` GraphQL types (`dto.ts`), the field fragments (`reviewFields.ts`), the four mappers (`mapReview`, `mapReviewWithFlags`, `mapWorkflow`, `mapStepCandidate`, one per file) and the gateway interface `IReviewGateway` with its parameter types. A gateway never throws for an envelope error and rejects only on a transport failure (R204).
- `review/useCases/` holds the use-case interfaces only (`IReviewReadUseCases`, `IReviewActionUseCases`, `IReviewListUseCases`, `IReviewCancelForDeleteUseCases`, composite `IReviewUseCases`). Task 9 implements them once.
- `review/content/IReviewContentAdapter.ts` and `review/cache/IReviewCacheWriter.ts` are the two per-app extension interfaces (Tasks 11, 12, 21, 24).
- `REVIEW_FIELDS` is list-safe (no `assignments`). Single reads add the assignment log with `steps { ${REVIEW_ASSIGNMENT_FIELDS} }`, which GraphQL merges into the same `steps` selection; `REVIEW_WITH_FLAGS_FIELDS` is the list-safe `review` plus `flags` selection and `REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS` is the single-read variant (so the two apps do not each compose the merge, R202).
- `allowManualPick` mirrors `packages/api-workflows/src/domain/workflow/canPickReviewer.ts`: true only for a step of type `review` whose `config.assignment.allowManualPick === true`.
- `WorkflowsWorkflow.models` (the namespaces a workflow binds) maps to `ReviewWorkflow.namespaces`; `WorkflowsReview.model` maps to `Review.namespace`; `WorkflowsReview.workflow.name` maps to `Review.workflowName`.
- The test fixtures live in `packages/app-workflows/src/review/testing/reviewFixtures.ts` (R243; pure builders, no vitest, mobx or `@webiny/di`; later `app-workflows` tasks import them as `~/review/testing/reviewFixtures.js`, other packages as `@webiny/app-workflows/review/testing/reviewFixtures.js`). They ship in `dist` on purpose: a co-located test importing from `__tests__/` fails the build with TS6059 (`rootDir: ./src`). `createReview(overrides)` builds a domain review with the defaults of R243 (one awaiting step "Editorial check" `step-1`, no teams, title "Spring campaign", requester "Maja Kos") and `createReviewWithFlags(review, flags)` is positional.
- The barrel `packages/app-workflows/src/index.tsx` is not touched by Tasks 8-10 (R-k): app packages import the review modules through deep paths, nothing imports the new names through `@webiny/app-workflows`.

**Files:**
- Create: `packages/app-workflows/vitest.config.ts`
- Modify: `packages/app-workflows/package.json` (devDependency `vitest`)
- Create: `packages/app-workflows/src/review/domain/ReviewState.ts`, `StepState.ts`, `ReviewListKind.ts`, `ReviewListSort.ts`, `ReviewErrorCode.ts`, `constants.ts`, `types.ts`, `toReviewListRow.ts`, `toSystemWorkflow.ts`, `isReviewSelectable.ts`
- Create: `packages/app-workflows/src/review/gateway/dto.ts`, `reviewFields.ts`, `mapReview.ts`, `mapReviewWithFlags.ts`, `mapWorkflow.ts`, `mapStepCandidate.ts`, `IReviewGateway.ts`
- Create: `packages/app-workflows/src/review/useCases/IReviewReadUseCases.ts`, `IReviewActionUseCases.ts`, `IReviewListUseCases.ts`, `IReviewCancelForDeleteUseCases.ts`, `IReviewUseCases.ts`
- Create: `packages/app-workflows/src/review/content/IReviewContentAdapter.ts`, `packages/app-workflows/src/review/cache/IReviewCacheWriter.ts`
- Create: `packages/app-workflows/src/review/testing/reviewFixtures.ts`
- Create tests: `packages/app-workflows/src/review/domain/isReviewSelectable.test.ts`, `toSystemWorkflow.test.ts`, `toReviewListRow.test.ts`; `packages/app-workflows/src/review/gateway/mapReview.test.ts`, `mapReviewWithFlags.test.ts`, `mapWorkflow.test.ts`, `mapStepCandidate.test.ts`; `packages/app-workflows/__tests__/reviewFields.test.ts` (in `__tests__` on purpose, see Contract notes)

**Interfaces:**
- Consumes: Task 1 (`WorkflowsReviewStep.candidateTeams { id name }`, selected in `REVIEW_FIELDS`), Task 5b (`WorkflowsAssignmentEntry.userDisplayName`, selected in `REVIEW_ASSIGNMENT_FIELDS`, R251) and Task 5c (`WorkflowsReview.cancelledBy`, selected in `REVIEW_FIELDS`, R252); the fragments are text only, so this task does not need the API running. Existing, verified with codegraph: `packages/app-admin/vitest.config.ts` and `testing/createTestConfig.ts` (`createTestConfig`, `path`, `vitestConfig`), the server codes in `packages/api-workflows/src/domain/review/errors.ts`, `canPickReviewer.ts` (`REVIEW_STEP_TYPE = "review"` in `.../domain/workflow/stepTypes.ts`), `Review.getSystemWorkflow` (`.../domain/review/Review.ts`), the shared types in `packages/api-workflows/src/graphql/WorkflowsSchemaFactory.ts` (`WorkflowsReview`, `WorkflowsReviewStep`, `WorkflowsViewerFlags`, `WorkflowsWorkflow`, `WorkflowsStepCandidate`, `WorkflowsListMeta`, `WorkflowsError`).
- Produces (consumed by every later `app-workflows` task and the app packages):
  - `review/domain/`: `ReviewStateValue`, `ReviewState`, `StepStateValue`, `StepState`, `ReviewListKind`, `ReviewListSort`, `ReviewErrorCode`, `REVIEW_TITLE_MIN_LENGTH = 5`, `REJECT_COMMENT_MIN_LENGTH = 10`, `REVIEW_LIST_PAGE_SIZE = 20`, `REVIEW_WIDGET_PAGE_SIZE = 5`, `WORKFLOWS_NOTIFICATION_ACTION`, the interfaces of `types.ts` (exact names per the contract), `toReviewListRow`, `toSystemWorkflow`, `isReviewSelectable`.
  - `review/gateway/`: the DTO types of `dto.ts`, `REVIEW_FIELDS`, `REVIEW_ASSIGNMENT_FIELDS`, `REVIEW_WITH_FLAGS_FIELDS`, `REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS`, `WORKFLOW_FIELDS`, `STEP_CANDIDATE_FIELDS`, `ERROR_FIELDS`, `REVIEW_SYSTEM_WORKFLOW_SELECTION`, `mapReview`, `mapReviewWithFlags`, `mapWorkflow`, `mapStepCandidate`, `IReviewGateway` and its parameter types.
  - `review/useCases/`: `IReviewReadUseCases`, `IReviewActionUseCases`, `IReviewListUseCases` (+ `ReviewListPage`), `IReviewCancelForDeleteUseCases`, `IReviewUseCases`.
  - `IReviewContentAdapter` (+ `ReviewContentRef`), `IReviewCacheWriter` (+ `ReviewCacheRef`).

- [ ] **Step 1: Test setup, then write the failing tests**

Create `packages/app-workflows/vitest.config.ts` (copy of `packages/app-admin/vitest.config.ts`):

```ts
import { createTestConfig } from "../../testing";

export default async () => {
    return createTestConfig({
        path: import.meta.dirname,
        vitestConfig: {
            environment: "jsdom",
            fileParallelism: true
        }
    });
};
```

In `packages/app-workflows/package.json`, add `"vitest": "^4.1.11"` to `devDependencies`, keeping the keys sorted:

```json
  "devDependencies": {
    "@types/react": "18.3.31",
    "@webiny/build-tools": "0.0.0",
    "rimraf": "^6.1.3",
    "typescript": "^7.0.2",
    "vitest": "^4.1.11"
  },
```

Create the shared test fixtures `packages/app-workflows/src/review/testing/reviewFixtures.ts` (R243: pure data builders, no vitest, mobx or `@webiny/di` import; they live under `src`, not `__tests__`, because other packages import them as `@webiny/app-workflows/review/testing/reviewFixtures.js` and a co-located test importing from `__tests__/` fails the build with TS6059; the tests below import them as `~/review/testing/reviewFixtures.js`, so they exist before the tests run). The DTO builders serve the mapper tests; `createReview` and `createReviewWithFlags` build domain objects directly with the defaults every later task relies on (R243): one awaiting step "Editorial check" with id `step-1`, no teams, title "Spring campaign", id `review-1`, namespace `cms.article`, requester "Maja Kos".

```ts
import type { ReviewActorDto } from "~/review/gateway/dto.js";
import type { ReviewDto } from "~/review/gateway/dto.js";
import type { ReviewStepDto } from "~/review/gateway/dto.js";
import type { ReviewWithFlagsDto } from "~/review/gateway/dto.js";
import type { ViewerFlagsDto } from "~/review/gateway/dto.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewViewerFlags } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { ReviewState } from "~/review/domain/ReviewState.js";
import { StepState } from "~/review/domain/StepState.js";

export const T0 = "2026-10-16T08:00:00.000Z";
export const T1 = "2026-10-16T09:00:00.000Z";
export const T2 = "2026-10-16T10:00:00.000Z";
export const T3 = "2026-10-16T11:00:00.000Z";

export const createActorDto = (overrides: Partial<ReviewActorDto> = {}): ReviewActorDto => {
    return {
        type: "user",
        id: "user-1",
        displayName: "Ada Lovelace",
        identityType: "admin",
        ...overrides
    };
};

export const createStepDto = (overrides: Partial<ReviewStepDto> = {}): ReviewStepDto => {
    return {
        id: "step-1",
        title: "Editorial check",
        color: "#2f80ed",
        description: "Check the copy.",
        type: "review",
        state: "inReview",
        owner: createActorDto(),
        comment: null,
        pickedUserId: null,
        candidateTeamIds: ["team-1"],
        candidateTeams: [{ id: "team-1", name: "Editors" }],
        assignmentSource: "strategy",
        assignment: {
            source: "strategy",
            ruleId: null,
            reason: "Fewest open reviews.",
            by: null
        },
        reachedOn: T1,
        startedOn: T1,
        finishedOn: null,
        taskId: null,
        runs: [],
        issues: [],
        ...overrides
    };
};

export const createReviewDto = (overrides: Partial<ReviewDto> = {}): ReviewDto => {
    return {
        id: "review-1",
        workflowId: "workflow-1",
        model: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Launch article",
        isActive: true,
        state: "inProgress",
        currentStepId: "step-2",
        currentStepState: "awaiting",
        currentStepType: "review",
        currentOwnerId: null,
        currentCandidateTeamIds: ["team-1"],
        targetContext: {
            folder: { id: "folder-1", type: "FmCmsEntry" },
            modelId: "article",
            title: "Launch article",
            author: { id: "user-2", displayName: "Grace Hopper" }
        },
        workflow: { name: "Editorial", models: ["cms.article"] },
        steps: [
            createStepDto({
                id: "step-1",
                title: "Draft check",
                state: "approved",
                finishedOn: T2
            }),
            createStepDto({
                id: "step-2",
                title: "Editorial check",
                state: "awaiting",
                owner: null,
                assignmentSource: null,
                assignment: null,
                startedOn: null,
                finishedOn: null
            })
        ],
        createdBy: createActorDto({ id: "user-2", displayName: "Grace Hopper" }),
        cancelledBy: null,
        createdOn: T0,
        savedOn: T3,
        lastChangedOn: T3,
        ...overrides
    };
};

export const createViewerFlagsDto = (overrides: Partial<ViewerFlagsDto> = {}): ViewerFlagsDto => {
    return {
        canStart: true,
        canTakeOver: false,
        canApprove: false,
        canReject: false,
        canCancel: true,
        canReassign: false,
        canRestart: false,
        ...overrides
    };
};

export const createReviewWithFlagsDto = (
    overrides: Partial<ReviewWithFlagsDto> = {}
): ReviewWithFlagsDto => {
    return {
        review: createReviewDto(),
        flags: createViewerFlagsDto(),
        ...overrides
    };
};

/**
 * The domain review every later `app-workflows` test starts from (R243): one awaiting step
 * "Editorial check" (`step-1`), no teams, title "Spring campaign", requester "Maja Kos".
 */
export const createReview = (overrides: Partial<Review> = {}): Review => {
    return {
        id: "review-1",
        workflowId: "workflow-1",
        namespace: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Spring campaign",
        isActive: true,
        state: ReviewState.InProgress,
        currentStepId: "step-1",
        currentStepType: "review",
        currentOwnerId: null,
        currentStepState: StepState.Awaiting,
        currentCandidateTeamIds: [],
        targetContext: {
            folder: null,
            modelId: "article",
            title: "Spring campaign",
            author: { id: "user-1", displayName: "Maja Kos" }
        },
        workflowName: "Content review",
        steps: [
            {
                id: "step-1",
                title: "Editorial check",
                color: "#FA5723",
                description: null,
                type: "review",
                state: StepState.Awaiting,
                owner: null,
                comment: null,
                pickedUserId: null,
                candidateTeamIds: [],
                candidateTeams: [],
                assignmentSource: null,
                assignment: null,
                reachedOn: null,
                startedOn: null,
                finishedOn: null,
                taskId: null,
                runs: [],
                issues: [],
                assignments: null
            }
        ],
        createdBy: { type: "user", id: "user-1", displayName: "Maja Kos", identityType: null },
        cancelledBy: null,
        createdOn: T0,
        savedOn: T1,
        lastChangedOn: T1,
        ...overrides
    };
};

const NO_FLAGS: ReviewViewerFlags = {
    canStart: false,
    canTakeOver: false,
    canApprove: false,
    canReject: false,
    canCancel: false,
    canReassign: false,
    canRestart: false
};

/** Positional (R243): the review first, then the flags; both default (all flags false). */
export const createReviewWithFlags = (
    review: Review = createReview(),
    flags: ReviewViewerFlags = NO_FLAGS
): ReviewWithFlags => {
    return { review, flags };
};
```

Create `packages/app-workflows/src/review/domain/isReviewSelectable.test.ts`:

```ts
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { isReviewSelectable } from "./isReviewSelectable.js";
import { ReviewState } from "./ReviewState.js";

describe("isReviewSelectable", () => {
    it("is true for an approved review", () => {
        expect(isReviewSelectable(ReviewState.Approved)).toBe(true);
    });

    it("is true for a row with no review state (content without a workflow)", () => {
        expect(isReviewSelectable(null)).toBe(true);
    });

    it("is false for every other review state", () => {
        expect(isReviewSelectable(ReviewState.InProgress)).toBe(false);
        expect(isReviewSelectable(ReviewState.Rejected)).toBe(false);
        expect(isReviewSelectable(ReviewState.Cancelled)).toBe(false);
    });
});
```

Create `packages/app-workflows/src/review/domain/toSystemWorkflow.test.ts`:

```ts
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { toSystemWorkflow } from "./toSystemWorkflow.js";
import { ReviewState } from "./ReviewState.js";
import { StepState } from "./StepState.js";
import { createReview } from "~/review/testing/reviewFixtures.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createStepDto } from "~/review/testing/reviewFixtures.js";
import { mapReview } from "~/review/gateway/mapReview.js";

describe("toSystemWorkflow", () => {
    it("returns null for no review", () => {
        expect(toSystemWorkflow(null)).toBeNull();
    });

    it("describes an in-progress review by its current step", () => {
        const review = createReview();

        expect(toSystemWorkflow(review)).toEqual({
            workflowId: "workflow-1",
            reviewState: ReviewState.InProgress,
            stepId: "step-1",
            stepName: "Editorial check",
            stepState: StepState.Awaiting
        });
    });

    it("derives approved from an approved current step", () => {
        const review = mapReview(
            createReviewDto({
                state: "approved",
                currentStepId: "step-2",
                currentStepState: "approved",
                steps: [
                    createStepDto({ id: "step-1", title: "Draft check", state: "approved" }),
                    createStepDto({ id: "step-2", title: "Editorial check", state: "approved" })
                ]
            })
        );

        expect(toSystemWorkflow(review)).toEqual({
            workflowId: "workflow-1",
            reviewState: ReviewState.Approved,
            stepId: "step-2",
            stepName: "Editorial check",
            stepState: StepState.Approved
        });
    });

    it("derives rejected from a rejected current step", () => {
        const review = mapReview(
            createReviewDto({
                state: "rejected",
                currentStepId: "step-2",
                currentStepState: "rejected",
                steps: [
                    createStepDto({ id: "step-1", title: "Draft check", state: "approved" }),
                    createStepDto({ id: "step-2", title: "Editorial check", state: "rejected" })
                ]
            })
        );

        const value = toSystemWorkflow(review);

        expect(value?.reviewState).toBe(ReviewState.Rejected);
        expect(value?.stepState).toBe(StepState.Rejected);
    });

    it("keeps an in-review step as in progress", () => {
        const review = mapReview(
            createReviewDto({
                currentStepId: "step-1",
                currentStepState: "inReview",
                steps: [
                    createStepDto({ id: "step-1", title: "Draft check", state: "inReview" }),
                    createStepDto({ id: "step-2", title: "Editorial check", state: "pending" })
                ]
            })
        );

        expect(toSystemWorkflow(review)).toEqual({
            workflowId: "workflow-1",
            reviewState: ReviewState.InProgress,
            stepId: "step-1",
            stepName: "Draft check",
            stepState: StepState.InReview
        });
    });

    it("takes the first step that is not approved, whatever currentStepId says (server rule)", () => {
        const review = mapReview(createReviewDto({ currentStepId: null, currentStepState: null }));

        expect(toSystemWorkflow(review)).toEqual({
            workflowId: "workflow-1",
            reviewState: ReviewState.InProgress,
            stepId: "step-2",
            stepName: "Editorial check",
            stepState: StepState.Awaiting
        });
    });

    it("skips every approved step before the current one", () => {
        const review = mapReview(
            createReviewDto({
                currentStepId: "step-1",
                steps: [
                    createStepDto({ id: "step-1", title: "One", state: "approved" }),
                    createStepDto({ id: "step-2", title: "Two", state: "approved" }),
                    createStepDto({ id: "step-3", title: "Three", state: "inReview" })
                ]
            })
        );

        expect(toSystemWorkflow(review)?.stepId).toBe("step-3");
    });

    it("returns null for a cancelled review (the target is unlocked)", () => {
        const review = createReview({
            state: ReviewState.Cancelled,
            isActive: false,
            currentStepId: null,
            currentStepState: null
        });

        expect(toSystemWorkflow(review)).toBeNull();
    });

    it("returns null for a review without steps", () => {
        const review = createReview({ steps: [], currentStepId: null });

        expect(toSystemWorkflow(review)).toBeNull();
    });
});
```

Create `packages/app-workflows/src/review/domain/toReviewListRow.test.ts`:

```ts
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { toReviewListRow } from "./toReviewListRow.js";
import { ReviewState } from "./ReviewState.js";
import { StepState } from "./StepState.js";
import { createActorDto } from "~/review/testing/reviewFixtures.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { createStepDto } from "~/review/testing/reviewFixtures.js";
import { createViewerFlagsDto } from "~/review/testing/reviewFixtures.js";
import { T3 } from "~/review/testing/reviewFixtures.js";
import { mapReviewWithFlags } from "~/review/gateway/mapReviewWithFlags.js";

describe("toReviewListRow", () => {
    it("maps a review without a step owner to an app-neutral row", () => {
        const item = mapReviewWithFlags(
            createReviewWithFlagsDto({
                flags: createViewerFlagsDto({ canStart: true, canCancel: true })
            })
        );

        const row = toReviewListRow(item);

        expect(row).toEqual({
            namespace: "cms.article",
            reviewId: "review-1",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            title: "Launch article",
            reviewState: ReviewState.InProgress,
            stepId: "step-2",
            stepTitle: "Editorial check",
            stepState: StepState.Awaiting,
            owner: null,
            requester: {
                type: "user",
                id: "user-2",
                displayName: "Grace Hopper",
                identityType: "admin"
            },
            lastChangedOn: T3,
            contentTypeId: "article",
            flags: {
                canStart: true,
                canTakeOver: false,
                canApprove: false,
                canReject: false,
                canCancel: true,
                canReassign: false,
                canRestart: false
            }
        });
    });

    it("carries the current step owner", () => {
        const item = mapReviewWithFlags(
            createReviewWithFlagsDto({
                review: createReviewDto({
                    currentStepId: "step-1",
                    currentStepState: "inReview",
                    steps: [
                        createStepDto({
                            id: "step-1",
                            title: "Draft check",
                            state: "inReview",
                            owner: createActorDto({ id: "user-7", displayName: "Edsger Dijkstra" })
                        })
                    ]
                })
            })
        );

        const row = toReviewListRow(item);

        expect(row.stepTitle).toBe("Draft check");
        expect(row.owner).toEqual({
            type: "user",
            id: "user-7",
            displayName: "Edsger Dijkstra",
            identityType: "admin"
        });
    });

    it("leaves step fields empty for a review without a current step", () => {
        const item = mapReviewWithFlags(
            createReviewWithFlagsDto({
                review: createReviewDto({
                    state: "cancelled",
                    isActive: false,
                    currentStepId: null,
                    currentStepState: null,
                    currentStepType: null
                })
            })
        );

        const row = toReviewListRow(item);

        expect(row.reviewState).toBe(ReviewState.Cancelled);
        expect(row.stepId).toBeNull();
        expect(row.stepTitle).toBeNull();
        expect(row.stepState).toBeNull();
        expect(row.owner).toBeNull();
    });
});
```

Create `packages/app-workflows/src/review/gateway/mapReview.test.ts`:

```ts
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { mapReview } from "./mapReview.js";
import type { ReviewDto } from "./dto.js";
import type { ReviewStepDto } from "./dto.js";
import { createActorDto } from "~/review/testing/reviewFixtures.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createStepDto } from "~/review/testing/reviewFixtures.js";
import { T0 } from "~/review/testing/reviewFixtures.js";
import { T1 } from "~/review/testing/reviewFixtures.js";
import { T2 } from "~/review/testing/reviewFixtures.js";
import { T3 } from "~/review/testing/reviewFixtures.js";

describe("mapReview", () => {
    it("maps every field of a fully populated review", () => {
        const owner = createActorDto({ id: "user-7", displayName: "Edsger Dijkstra" });
        const assigner = createActorDto({ type: "automation", id: "auto-1", displayName: "Router" });
        const step: ReviewStepDto = createStepDto({
            id: "step-1",
            title: "Draft check",
            color: "#eb5757",
            description: "Check the draft.",
            type: "review",
            state: "approved",
            owner,
            comment: "Looks good.",
            pickedUserId: "user-7",
            candidateTeamIds: ["team-1", "team-2"],
            candidateTeams: [
                { id: "team-1", name: "Editors" },
                { id: "team-2", name: "Legal" }
            ],
            assignmentSource: "pick",
            assignment: {
                source: "pick",
                ruleId: "rule-1",
                reason: "Picked by the requester.",
                by: assigner
            },
            reachedOn: T1,
            startedOn: T1,
            finishedOn: T2,
            taskId: "task-1",
            runs: [
                {
                    taskId: "task-0",
                    startedOn: T0,
                    finishedOn: T1,
                    outcome: "failed",
                    reason: "Timed out."
                }
            ],
            issues: [
                {
                    fieldPath: "values.title",
                    severity: "warning",
                    message: "Too long.",
                    suggestion: "Shorten it."
                }
            ],
            assignments: [
                {
                    id: "assignment-1",
                    kind: "skip",
                    userId: "user-9",
                    userDisplayName: "Pat Kim",
                    assignedOn: T1,
                    source: "strategy",
                    ruleId: "rule-2",
                    by: assigner,
                    reason: "On leave."
                }
            ]
        });
        const dto = createReviewDto({
            steps: [step],
            currentStepId: "step-1",
            currentStepState: "approved",
            currentStepType: "review",
            currentOwnerId: "user-7"
        });

        const review = mapReview(dto);

        expect(review).toEqual({
            id: "review-1",
            workflowId: "workflow-1",
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001",
            title: "Launch article",
            isActive: true,
            state: "inProgress",
            currentStepId: "step-1",
            currentStepType: "review",
            currentOwnerId: "user-7",
            currentStepState: "approved",
            currentCandidateTeamIds: ["team-1"],
            targetContext: {
                folder: { id: "folder-1", type: "FmCmsEntry" },
                modelId: "article",
                title: "Launch article",
                author: { id: "user-2", displayName: "Grace Hopper" }
            },
            workflowName: "Editorial",
            steps: [
                {
                    id: "step-1",
                    title: "Draft check",
                    color: "#eb5757",
                    description: "Check the draft.",
                    type: "review",
                    state: "approved",
                    owner: {
                        type: "user",
                        id: "user-7",
                        displayName: "Edsger Dijkstra",
                        identityType: "admin"
                    },
                    comment: "Looks good.",
                    pickedUserId: "user-7",
                    candidateTeamIds: ["team-1", "team-2"],
                    candidateTeams: [
                        { id: "team-1", name: "Editors" },
                        { id: "team-2", name: "Legal" }
                    ],
                    assignmentSource: "pick",
                    assignment: {
                        source: "pick",
                        ruleId: "rule-1",
                        reason: "Picked by the requester.",
                        by: {
                            type: "automation",
                            id: "auto-1",
                            displayName: "Router",
                            identityType: "admin"
                        }
                    },
                    reachedOn: T1,
                    startedOn: T1,
                    finishedOn: T2,
                    taskId: "task-1",
                    runs: [
                        {
                            taskId: "task-0",
                            startedOn: T0,
                            finishedOn: T1,
                            outcome: "failed",
                            reason: "Timed out."
                        }
                    ],
                    issues: [
                        {
                            fieldPath: "values.title",
                            severity: "warning",
                            message: "Too long.",
                            suggestion: "Shorten it."
                        }
                    ],
                    assignments: [
                        {
                            id: "assignment-1",
                            kind: "skip",
                            userId: "user-9",
                            userDisplayName: "Pat Kim",
                            assignedOn: T1,
                            source: "strategy",
                            ruleId: "rule-2",
                            by: {
                                type: "automation",
                                id: "auto-1",
                                displayName: "Router",
                                identityType: "admin"
                            },
                            reason: "On leave."
                        }
                    ]
                }
            ],
            createdBy: {
                type: "user",
                id: "user-2",
                displayName: "Grace Hopper",
                identityType: "admin"
            },
            cancelledBy: null,
            createdOn: T0,
            savedOn: T3,
            lastChangedOn: T3
        });
    });

    it("renames model to namespace and workflow.name to workflowName", () => {
        const review = mapReview(
            createReviewDto({ model: "wb.page", workflow: { name: "Page flow", models: ["wb.page"] } })
        );

        expect(review.namespace).toBe("wb.page");
        expect(review.workflowName).toBe("Page flow");
    });

    it("keeps candidateTeams as received and defaults an absent list to empty", () => {
        const withTeams = mapReview(
            createReviewDto({
                steps: [
                    createStepDto({
                        candidateTeams: [{ id: "team-9", name: "Press" }]
                    })
                ]
            })
        );
        const step = createStepDto();
        const withoutTeams = mapReview(
            createReviewDto({
                steps: [{ ...step, candidateTeams: undefined as unknown as ReviewStepDto["candidateTeams"] }]
            })
        );

        expect(withTeams.steps[0].candidateTeams).toEqual([{ id: "team-9", name: "Press" }]);
        expect(withoutTeams.steps[0].candidateTeams).toEqual([]);
    });

    it("maps nulls: no folder, no owner, no assignment, no timestamps, no comment", () => {
        const review = mapReview(
            createReviewDto({
                state: "cancelled",
                isActive: false,
                currentStepId: null,
                currentStepState: null,
                currentStepType: null,
                currentOwnerId: null,
                targetContext: {
                    folder: null,
                    modelId: "article",
                    title: "Launch article",
                    author: { id: "user-2", displayName: "Grace Hopper" }
                },
                steps: [
                    createStepDto({
                        description: null,
                        owner: null,
                        assignmentSource: null,
                        assignment: null,
                        reachedOn: null,
                        startedOn: null,
                        finishedOn: null
                    })
                ]
            })
        );

        expect(review.currentStepId).toBeNull();
        expect(review.currentStepState).toBeNull();
        expect(review.currentStepType).toBeNull();
        expect(review.currentOwnerId).toBeNull();
        expect(review.targetContext.folder).toBeNull();
        const step = review.steps[0];
        expect(step.description).toBeNull();
        expect(step.owner).toBeNull();
        expect(step.comment).toBeNull();
        expect(step.pickedUserId).toBeNull();
        expect(step.assignmentSource).toBeNull();
        expect(step.assignment).toBeNull();
        expect(step.reachedOn).toBeNull();
        expect(step.startedOn).toBeNull();
        expect(step.finishedOn).toBeNull();
        expect(step.taskId).toBeNull();
    });

    it("maps cancelledBy to an actor and an absent cancelledBy to null (R252)", () => {
        const cancelled = mapReview(
            createReviewDto({
                state: "cancelled",
                isActive: false,
                cancelledBy: createActorDto({ id: "user-5", displayName: "Nina Cole" })
            })
        );
        const running = mapReview(createReviewDto());
        const withoutField = mapReview({
            ...createReviewDto(),
            cancelledBy: undefined as unknown as ReviewDto["cancelledBy"]
        });

        expect(cancelled.cancelledBy).toEqual({
            type: "user",
            id: "user-5",
            displayName: "Nina Cole",
            identityType: "admin"
        });
        expect(running.cancelledBy).toBeNull();
        expect(withoutField.cancelledBy).toBeNull();
    });

    it("keeps the skipped person's display name and maps an absent one to null (R251)", () => {
        const entry = {
            id: "assignment-1",
            kind: "skip" as const,
            userId: "user-9",
            assignedOn: T1,
            source: "strategy",
            ruleId: null,
            by: null,
            reason: "On leave."
        };
        const review = mapReview(
            createReviewDto({
                steps: [
                    createStepDto({
                        assignments: [
                            { ...entry, userDisplayName: "Pat Kim" },
                            {
                                ...entry,
                                id: "assignment-2",
                                userDisplayName: undefined as unknown as string | null
                            },
                            { ...entry, id: "assignment-3", userDisplayName: null }
                        ]
                    })
                ]
            })
        );

        const names = review.steps[0].assignments?.map(item => item.userDisplayName);
        expect(names).toEqual(["Pat Kim", null, null]);
    });

    it("maps absent assignments (a list selection) to null and an empty log to an empty array", () => {
        const onList = mapReview(createReviewDto({ steps: [createStepDto()] }));
        const onSingle = mapReview(createReviewDto({ steps: [createStepDto({ assignments: [] })] }));

        expect(onList.steps[0].assignments).toBeNull();
        expect(onSingle.steps[0].assignments).toEqual([]);
    });

    it("maps an actor without an identity type to null", () => {
        const actor = createActorDto({ identityType: null });
        const review = mapReview(createReviewDto({ createdBy: actor }));

        expect(review.createdBy.identityType).toBeNull();
    });
});
```

Create `packages/app-workflows/src/review/gateway/mapReviewWithFlags.test.ts`:

```ts
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { mapReviewWithFlags } from "./mapReviewWithFlags.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { createViewerFlagsDto } from "~/review/testing/reviewFixtures.js";

describe("mapReviewWithFlags", () => {
    it("maps the review and keeps every viewer flag", () => {
        const dto = createReviewWithFlagsDto({
            review: createReviewDto({ id: "review-9" }),
            flags: createViewerFlagsDto({
                canStart: false,
                canTakeOver: true,
                canApprove: true,
                canReject: true,
                canCancel: false,
                canReassign: true,
                canRestart: true
            })
        });

        const result = mapReviewWithFlags(dto);

        expect(result.review.id).toBe("review-9");
        expect(result.review.namespace).toBe("cms.article");
        expect(result.flags).toEqual({
            canStart: false,
            canTakeOver: true,
            canApprove: true,
            canReject: true,
            canCancel: false,
            canReassign: true,
            canRestart: true
        });
    });
});
```

Create `packages/app-workflows/src/review/gateway/mapWorkflow.test.ts`:

```ts
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { mapWorkflow } from "./mapWorkflow.js";
import type { WorkflowDto } from "./dto.js";
import type { WorkflowStepDto } from "./dto.js";

const createStep = (overrides: Partial<WorkflowStepDto> = {}): WorkflowStepDto => {
    return {
        id: "step-1",
        title: "Editorial check",
        color: "#2f80ed",
        description: "Check the copy.",
        type: "review",
        config: {
            teams: ["team-1"],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        },
        ...overrides
    };
};

const createWorkflow = (steps: WorkflowStepDto[]): WorkflowDto => {
    return {
        id: "workflow-1",
        name: "Editorial",
        models: ["cms.article", "cms.page"],
        steps
    };
};

describe("mapWorkflow", () => {
    it("maps models to namespaces and every step field", () => {
        const workflow = mapWorkflow(createWorkflow([createStep()]));

        expect(workflow).toEqual({
            id: "workflow-1",
            name: "Editorial",
            namespaces: ["cms.article", "cms.page"],
            steps: [
                {
                    id: "step-1",
                    title: "Editorial check",
                    color: "#2f80ed",
                    description: "Check the copy.",
                    type: "review",
                    allowManualPick: false,
                    assignedAutomatically: false
                }
            ]
        });
    });

    it("sets assignedAutomatically for a review step whose strategy is not none (R246)", () => {
        const workflow = mapWorkflow(
            createWorkflow([
                createStep({ id: "a", config: { assignment: { strategy: "none" } } }),
                createStep({ id: "b", config: { assignment: { strategy: "roundRobin" } } }),
                createStep({ id: "c", config: { assignment: { strategy: "leastLoaded" } } })
            ])
        );

        expect(workflow.steps.map(step => step.assignedAutomatically)).toEqual([
            false,
            true,
            true
        ]);
    });

    it("leaves assignedAutomatically false when the config or the strategy is absent or unreadable", () => {
        const workflow = mapWorkflow(
            createWorkflow([
                createStep({ id: "a", config: null }),
                createStep({ id: "b", config: {} }),
                createStep({ id: "c", config: { assignment: null } }),
                createStep({ id: "d", config: { assignment: {} } }),
                createStep({ id: "e", config: { assignment: { strategy: 1 } } })
            ])
        );

        expect(workflow.steps.map(step => step.assignedAutomatically)).toEqual([
            false,
            false,
            false,
            false,
            false
        ]);
    });

    it("sets allowManualPick for a review step that allows it", () => {
        const workflow = mapWorkflow(
            createWorkflow([
                createStep({
                    config: {
                        teams: ["team-1"],
                        assignment: { strategy: "none", allowManualPick: true, rules: [] }
                    }
                })
            ])
        );

        expect(workflow.steps[0].allowManualPick).toBe(true);
    });

    it("leaves allowManualPick false when the config or the flag is absent or not true", () => {
        const workflow = mapWorkflow(
            createWorkflow([
                createStep({ id: "a", config: null }),
                createStep({ id: "b", config: {} }),
                createStep({ id: "c", config: { assignment: null } }),
                createStep({ id: "d", config: { assignment: {} } }),
                createStep({ id: "e", config: { assignment: { allowManualPick: "true" } } })
            ])
        );

        expect(workflow.steps.map(step => step.allowManualPick)).toEqual([
            false,
            false,
            false,
            false,
            false
        ]);
    });

    it("never allows a manual pick on a step that is not a review step", () => {
        const workflow = mapWorkflow(
            createWorkflow([
                createStep({
                    type: "ai",
                    config: { assignment: { allowManualPick: true, strategy: "roundRobin" } }
                })
            ])
        );

        expect(workflow.steps[0].allowManualPick).toBe(false);
        expect(workflow.steps[0].assignedAutomatically).toBe(false);
    });

    it("maps an absent description to null", () => {
        const workflow = mapWorkflow(createWorkflow([createStep({ description: null })]));

        expect(workflow.steps[0].description).toBeNull();
    });
});
```

Create `packages/app-workflows/src/review/gateway/mapStepCandidate.test.ts`:

```ts
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { mapStepCandidate } from "./mapStepCandidate.js";

describe("mapStepCandidate", () => {
    it("maps an eligible candidate", () => {
        const candidate = mapStepCandidate({
            id: "user-1",
            displayName: "Ada Lovelace",
            excluded: false,
            excludedReason: null
        });

        expect(candidate).toEqual({
            id: "user-1",
            displayName: "Ada Lovelace",
            excluded: false,
            excludedReason: null
        });
    });

    it("keeps the excluded reason", () => {
        const candidate = mapStepCandidate({
            id: "user-2",
            displayName: "Grace Hopper",
            excluded: true,
            excludedReason: "On leave until Monday."
        });

        expect(candidate.excluded).toBe(true);
        expect(candidate.excludedReason).toBe("On leave until Monday.");
    });

    it("maps an excluded candidate without a reason (the viewer may not see reasons, D97)", () => {
        const candidate = mapStepCandidate({
            id: "user-3",
            displayName: "Edsger Dijkstra",
            excluded: true,
            excludedReason: null
        });

        expect(candidate.excluded).toBe(true);
        expect(candidate.excludedReason).toBeNull();
    });
});
```

Create `packages/app-workflows/__tests__/reviewFields.test.ts` (the one test under `__tests__`: `scripts/typecheckTests/getPackagesWithTests.ts` lists a package for `yarn check:test:types` only when `__tests__/` holds a `*.test.ts`, and the check then covers the co-located tests too, since `tsconfig.json` includes `src`):

```ts
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { ERROR_FIELDS } from "~/review/gateway/reviewFields.js";
import { REVIEW_ASSIGNMENT_FIELDS } from "~/review/gateway/reviewFields.js";
import { REVIEW_FIELDS } from "~/review/gateway/reviewFields.js";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "~/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "~/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_FIELDS } from "~/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "~/review/gateway/reviewFields.js";
import { WORKFLOW_FIELDS } from "~/review/gateway/reviewFields.js";

const isBalanced = (selection: string): boolean => {
    let depth = 0;
    for (const char of selection) {
        if (char === "{") {
            depth++;
        }
        if (char === "}") {
            depth--;
        }
        if (depth < 0) {
            return false;
        }
    }
    return depth === 0;
};

const words = (selection: string): string[] => {
    return selection.split(/\s+/).filter(Boolean);
};

describe("reviewFields", () => {
    it("pins the system workflow selection (R213)", () => {
        expect(REVIEW_SYSTEM_WORKFLOW_SELECTION).toBe(
            "workflowId reviewState stepId stepName stepState"
        );
    });

    it("keeps every selection balanced", () => {
        const selections = [
            ERROR_FIELDS,
            REVIEW_ASSIGNMENT_FIELDS,
            REVIEW_FIELDS,
            REVIEW_WITH_FLAGS_FIELDS,
            REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS,
            STEP_CANDIDATE_FIELDS,
            WORKFLOW_FIELDS
        ];

        for (const selection of selections) {
            expect(isBalanced(selection)).toBe(true);
        }
    });

    it("selects the team names with the team ids (Q7)", () => {
        expect(REVIEW_FIELDS).toContain("candidateTeamIds");
        expect(REVIEW_FIELDS).toMatch(/candidateTeams\s*\{\s*id\s+name\s*\}/);
    });

    it("selects who cancelled the review and the skipped person's name (R251, R252)", () => {
        expect(REVIEW_FIELDS).toMatch(/cancelledBy\s*\{[^}]*\bid\b[^}]*\bdisplayName\b[^}]*\}/);
        expect(words(REVIEW_ASSIGNMENT_FIELDS)).toContain("userDisplayName");
        expect(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS).toContain("userDisplayName");
        expect(REVIEW_WITH_FLAGS_FIELDS).not.toContain("userDisplayName");
    });

    it("selects the run, issue and task fields the mapper reads", () => {
        expect(REVIEW_FIELDS).toMatch(/runs\s*\{[^}]*taskId[^}]*outcome[^}]*\}/);
        expect(REVIEW_FIELDS).toMatch(/issues\s*\{[^}]*fieldPath[^}]*suggestion[^}]*\}/);
        expect(words(REVIEW_FIELDS)).toContain("taskId");
    });

    it("leaves the assignment log out of the list-safe selections", () => {
        expect(REVIEW_FIELDS).not.toContain("assignments");
        expect(REVIEW_WITH_FLAGS_FIELDS).not.toContain("assignments");
    });

    it("puts the assignment log only in the single-read selections", () => {
        expect(REVIEW_ASSIGNMENT_FIELDS).toMatch(/^\s*assignments\s*\{/);
        expect(REVIEW_ASSIGNMENT_FIELDS).toContain("kind");
        expect(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS).toContain("assignments");
        expect(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS).toMatch(/steps\s*\{\s*assignments/);
    });

    it("selects every viewer flag next to the review", () => {
        for (const flag of [
            "canStart",
            "canTakeOver",
            "canApprove",
            "canReject",
            "canCancel",
            "canReassign",
            "canRestart"
        ]) {
            expect(words(REVIEW_WITH_FLAGS_FIELDS)).toContain(flag);
        }
        expect(REVIEW_WITH_FLAGS_FIELDS).toMatch(/review\s*\{/);
        expect(REVIEW_WITH_FLAGS_FIELDS).toMatch(/flags\s*\{/);
    });

    it("selects the workflow models and the step config the mapper needs", () => {
        expect(words(WORKFLOW_FIELDS)).toContain("models");
        expect(words(WORKFLOW_FIELDS)).toContain("config");
        expect(words(WORKFLOW_FIELDS)).toContain("type");
    });

    it("selects the step candidate and error fields", () => {
        expect(words(STEP_CANDIDATE_FIELDS)).toEqual([
            "id",
            "displayName",
            "excluded",
            "excludedReason"
        ]);
        expect(words(ERROR_FIELDS)).toEqual(["code", "message", "data"]);
    });
});
```

(Prettier rewraps the long lines in the tests on `yarn format:fix`.)

- [ ] **Step 2: Run the tests and expect failure**

Run `yarn > /dev/null 2>&1` first (the `package.json` edit adds `vitest`). Run each file on its own (admin package: `yarn test` only, there is no storage-specific run for `app-workflows`):

```bash
yarn test packages/app-workflows/src/review/domain/isReviewSelectable.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/domain/toSystemWorkflow.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/domain/toReviewListRow.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/gateway/mapReview.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/gateway/mapReviewWithFlags.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/gateway/mapWorkflow.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/gateway/mapStepCandidate.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/__tests__/reviewFields.test.ts 2>&1 | tail -50
```

Expected: the runner starts (this proves A75: `createTestConfig` finds `packages/app-workflows/vitest.config.ts`, the file path is accepted and the `~/` alias resolves; if it reports "missing a vitest.config.ts", re-check the file name and that `yarn` was run after the `package.json` edit) and every file FAILS with `Failed to resolve import "./<module>.js"` (or `~/review/...`): the source files do not exist yet. Record the A75 result (runner starts, tests discovered) in the commit body.

- [ ] **Step 3: Implement**

All paths below are under `packages/app-workflows/src/review/`.

`domain/ReviewState.ts`:

```ts
export const ReviewState = {
    InProgress: "inProgress",
    Approved: "approved",
    Rejected: "rejected",
    Cancelled: "cancelled"
} as const;

export type ReviewStateValue = (typeof ReviewState)[keyof typeof ReviewState];
```

`domain/StepState.ts`:

```ts
export const StepState = {
    Pending: "pending",
    Awaiting: "awaiting",
    InReview: "inReview",
    Approved: "approved",
    Rejected: "rejected",
    Failed: "failed"
} as const;

export type StepStateValue = (typeof StepState)[keyof typeof StepState];
```

`domain/ReviewListKind.ts`:

```ts
export type ReviewListKind =
    | "assignedToMe"
    | "pool"
    | "teamInReview"
    | "myRequests"
    | "failedSteps";
```

`domain/ReviewListSort.ts`:

```ts
export type ReviewListSort = "lastChangedOn_ASC" | "lastChangedOn_DESC";
```

`domain/ReviewErrorCode.ts` (mirror of `packages/api-workflows/src/domain/review/errors.ts`; `NotAuthorized` and `NotAuthenticated` are the shared codes of the wrappers):

```ts
export const ReviewErrorCode = {
    NotFound: "Workflows/Review/NotFound",
    Validation: "Workflows/Review/Validation",
    InvalidState: "Workflows/Review/InvalidState",
    StepNotCurrent: "Workflows/Review/StepNotCurrent",
    RequesterCannotReview: "Workflows/Review/RequesterCannotReview",
    NotCandidate: "Workflows/Review/NotCandidate",
    AlreadyOwner: "Workflows/Review/AlreadyOwner",
    NotOwner: "Workflows/Review/NotOwner",
    StepNotTakeable: "Workflows/Review/StepNotTakeable",
    StepNotReassignable: "Workflows/Review/StepNotReassignable",
    ReassignTargetInvalid: "Workflows/Review/ReassignTargetInvalid",
    AlreadyActive: "Workflows/Review/AlreadyActive",
    TargetLocked: "Workflows/Review/TargetLocked",
    PublishBlocked: "Workflows/Review/PublishBlocked",
    ActiveReviewOnTrash: "Workflows/Review/ActiveReviewOnTrash",
    NotAuthorized: "Workflows/NotAuthorized",
    NotAuthenticated: "Workflows/NotAuthenticated"
} as const;
```

`domain/constants.ts`:

```ts
export const REVIEW_TITLE_MIN_LENGTH = 5;
export const REJECT_COMMENT_MIN_LENGTH = 10;
export const REVIEW_LIST_PAGE_SIZE = 20;
export const REVIEW_WIDGET_PAGE_SIZE = 5;
export const WORKFLOWS_NOTIFICATION_ACTION = "workflows.notification";
```

`domain/types.ts`:

```ts
import type { ReviewStateValue } from "./ReviewState.js";
import type { StepStateValue } from "./StepState.js";

export type ReviewActorType = "user" | "ai" | "automation";

export type ReviewForDeleteAction = "trash" | "delete";

export interface ReviewActor {
    type: ReviewActorType;
    id: string;
    displayName: string;
    identityType: string | null;
}

export interface ReviewStepAssignment {
    source: string;
    ruleId: string | null;
    reason: string | null;
    by: ReviewActor | null;
}

export interface ReviewAssignmentEntry {
    id: string;
    kind: "outcome" | "skip";
    userId: string | null;
    userDisplayName: string | null;
    assignedOn: string;
    source: string;
    ruleId: string | null;
    by: ReviewActor | null;
    reason: string | null;
}

export interface ReviewStepRun {
    taskId: string | null;
    startedOn: string;
    finishedOn: string | null;
    outcome: string | null;
    reason: string | null;
}

export interface ReviewAiIssue {
    fieldPath: string | null;
    severity: string;
    message: string;
    suggestion: string | null;
}

export interface ReviewCandidateTeam {
    id: string;
    name: string;
}

export interface ReviewStep {
    id: string;
    title: string;
    color: string;
    description: string | null;
    type: string;
    state: StepStateValue;
    owner: ReviewActor | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[];
    candidateTeams: ReviewCandidateTeam[];
    assignmentSource: string | null;
    assignment: ReviewStepAssignment | null;
    reachedOn: string | null;
    startedOn: string | null;
    finishedOn: string | null;
    taskId: string | null;
    runs: ReviewStepRun[];
    issues: ReviewAiIssue[];
    assignments: ReviewAssignmentEntry[] | null;
}

export interface ReviewTargetFolder {
    id: string;
    type: string;
}

export interface ReviewTargetAuthor {
    id: string;
    displayName: string;
}

export interface ReviewTargetContext {
    folder: ReviewTargetFolder | null;
    modelId: string;
    title: string;
    author: ReviewTargetAuthor;
}

export interface Review {
    id: string;
    workflowId: string;
    namespace: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    isActive: boolean;
    state: ReviewStateValue;
    currentStepId: string | null;
    currentStepType: string | null;
    currentOwnerId: string | null;
    currentStepState: StepStateValue | null;
    currentCandidateTeamIds: string[];
    targetContext: ReviewTargetContext;
    workflowName: string;
    steps: ReviewStep[];
    createdBy: ReviewActor;
    cancelledBy: ReviewActor | null;
    createdOn: string;
    savedOn: string;
    lastChangedOn: string;
}

export interface ReviewViewerFlags {
    canStart: boolean;
    canTakeOver: boolean;
    canApprove: boolean;
    canReject: boolean;
    canCancel: boolean;
    canReassign: boolean;
    canRestart: boolean;
}

export interface ReviewWithFlags {
    review: Review;
    flags: ReviewViewerFlags;
}

export interface ReviewWorkflowStep {
    id: string;
    title: string;
    color: string;
    description: string | null;
    type: string;
    allowManualPick: boolean;
    assignedAutomatically: boolean;
}

export interface ReviewWorkflow {
    id: string;
    name: string;
    namespaces: string[];
    steps: ReviewWorkflowStep[];
}

export interface ReviewTarget {
    namespace: string;
    targetRevisionId: string;
}

export interface StepCandidate {
    id: string;
    displayName: string;
    excluded: boolean;
    excludedReason: string | null;
}

export interface BlockingReview {
    reviewId: string;
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    stepPosition: number;
    stepCount: number;
    stepName: string;
}

export interface ActiveReviewOnTrashData {
    model: string;
    action: ReviewForDeleteAction;
    reviews: BlockingReview[];
}

/**
 * One row of a review list, app-neutral (R206). Private state of `ReviewListPresenter`, never a
 * view model (R234).
 */
export interface ReviewListRow {
    namespace: string;
    reviewId: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    reviewState: ReviewStateValue;
    stepId: string | null;
    stepTitle: string | null;
    stepState: StepStateValue | null;
    owner: ReviewActor | null;
    requester: ReviewActor;
    lastChangedOn: string;
    contentTypeId: string;
    flags: ReviewViewerFlags;
}

export interface ReviewListMeta {
    cursor: string | null;
    hasMoreItems: boolean;
}

/** `meta.system.workflow` of a target revision in the shape the lists select (R213). */
export interface SystemWorkflowValue {
    workflowId: string;
    reviewState: ReviewStateValue;
    stepId: string | null;
    stepName: string | null;
    stepState: StepStateValue | null;
}
```

`domain/isReviewSelectable.ts`:

```ts
import { ReviewState } from "./ReviewState.js";
import type { ReviewStateValue } from "./ReviewState.js";

/**
 * Whether a content row may be selected for an action that review blocks (move, schedule): only an
 * approved review allows it, and so does a row with no review state at all (no workflow, D121).
 */
export const isReviewSelectable = (state: ReviewStateValue | null): boolean => {
    return state === null || state === ReviewState.Approved;
};
```

`domain/toSystemWorkflow.ts`:

```ts
import { ReviewState } from "./ReviewState.js";
import type { ReviewStateValue } from "./ReviewState.js";
import { StepState } from "./StepState.js";
import type { StepStateValue } from "./StepState.js";
import type { Review } from "./types.js";
import type { SystemWorkflowValue } from "./types.js";

const deriveReviewState = (stepState: StepStateValue): ReviewStateValue => {
    if (stepState === StepState.Rejected) {
        return ReviewState.Rejected;
    }
    if (stepState === StepState.Approved) {
        return ReviewState.Approved;
    }
    return ReviewState.InProgress;
};

/**
 * The `meta.system.workflow` value of a target revision, mirror of `Review.getSystemWorkflow()` in
 * api-workflows: `null` for no review or a cancelled one (D75); the current step is the first step
 * that is not approved (`findCurrentStep`), else the last step; the review state follows that step.
 */
export const toSystemWorkflow = (review: Review | null): SystemWorkflowValue | null => {
    if (!review || review.state === ReviewState.Cancelled) {
        return null;
    }
    const current =
        review.steps.find(step => step.state !== StepState.Approved) ?? review.steps.at(-1);
    if (!current) {
        return null;
    }
    return {
        workflowId: review.workflowId,
        reviewState: deriveReviewState(current.state),
        stepId: current.id,
        stepName: current.title,
        stepState: current.state
    };
};
```

`domain/toReviewListRow.ts`:

```ts
import type { ReviewListRow } from "./types.js";
import type { ReviewWithFlags } from "./types.js";

/** One list item as an app-neutral row (R206): the namespace stays on the row. */
export const toReviewListRow = (item: ReviewWithFlags): ReviewListRow => {
    const { review, flags } = item;
    const step = review.steps.find(candidate => candidate.id === review.currentStepId);
    return {
        namespace: review.namespace,
        reviewId: review.id,
        targetId: review.targetId,
        targetRevisionId: review.targetRevisionId,
        title: review.title,
        reviewState: review.state,
        stepId: review.currentStepId,
        stepTitle: step ? step.title : null,
        stepState: review.currentStepState,
        owner: step ? step.owner : null,
        requester: review.createdBy,
        lastChangedOn: review.lastChangedOn,
        contentTypeId: review.targetContext.modelId,
        flags
    };
};
```

`gateway/dto.ts`:

```ts
import type { ReviewActorType } from "~/review/domain/types.js";
import type { ReviewListMeta } from "~/review/domain/types.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";

export interface ReviewActorDto {
    type: ReviewActorType;
    id: string;
    displayName: string;
    identityType: string | null;
}

export interface ReviewStepAssignmentDto {
    source: string;
    ruleId: string | null;
    reason: string | null;
    by: ReviewActorDto | null;
}

export interface ReviewAssignmentEntryDto {
    id: string;
    kind: "outcome" | "skip";
    userId: string | null;
    userDisplayName: string | null;
    assignedOn: string;
    source: string;
    ruleId: string | null;
    by: ReviewActorDto | null;
    reason: string | null;
}

export interface ReviewStepRunDto {
    taskId: string | null;
    startedOn: string;
    finishedOn: string | null;
    outcome: string | null;
    reason: string | null;
}

export interface ReviewAiIssueDto {
    fieldPath: string | null;
    severity: string;
    message: string;
    suggestion: string | null;
}

export interface ReviewCandidateTeamDto {
    id: string;
    name: string;
}

export interface ReviewStepDto {
    id: string;
    title: string;
    color: string;
    description: string | null;
    type: string;
    state: StepStateValue;
    owner: ReviewActorDto | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[];
    candidateTeams: ReviewCandidateTeamDto[];
    assignmentSource: string | null;
    assignment: ReviewStepAssignmentDto | null;
    reachedOn: string | null;
    startedOn: string | null;
    finishedOn: string | null;
    taskId: string | null;
    runs: ReviewStepRunDto[];
    issues: ReviewAiIssueDto[];
    /** Only on a single review read (`REVIEW_ASSIGNMENT_FIELDS`); absent on lists. */
    assignments?: ReviewAssignmentEntryDto[] | null;
}

export interface ReviewTargetFolderDto {
    id: string;
    type: string;
}

export interface ReviewTargetAuthorDto {
    id: string;
    displayName: string;
}

export interface ReviewTargetContextDto {
    folder: ReviewTargetFolderDto | null;
    modelId: string;
    title: string;
    author: ReviewTargetAuthorDto;
}

export interface ReviewWorkflowRefDto {
    name: string;
    models: string[];
}

export interface ReviewDto {
    id: string;
    workflowId: string;
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    isActive: boolean;
    state: ReviewStateValue;
    currentStepId: string | null;
    currentStepState: StepStateValue | null;
    currentStepType: string | null;
    currentOwnerId: string | null;
    currentCandidateTeamIds: string[];
    targetContext: ReviewTargetContextDto;
    workflow: ReviewWorkflowRefDto;
    steps: ReviewStepDto[];
    createdBy: ReviewActorDto;
    cancelledBy: ReviewActorDto | null;
    createdOn: string;
    savedOn: string;
    lastChangedOn: string;
}

export interface ViewerFlagsDto {
    canStart: boolean;
    canTakeOver: boolean;
    canApprove: boolean;
    canReject: boolean;
    canCancel: boolean;
    canReassign: boolean;
    canRestart: boolean;
}

export interface ReviewWithFlagsDto {
    review: ReviewDto;
    flags: ViewerFlagsDto;
}

export interface WorkflowStepDto {
    id: string;
    title: string;
    color: string;
    description: string | null;
    type: string;
    /** The step config (JSON); only `assignment.allowManualPick` of a review step is read. */
    config: unknown;
}

export interface WorkflowDto {
    id: string;
    name: string;
    /** The namespaces the workflow binds (`cms.<modelId>`, `wb.page`). */
    models: string[];
    steps: WorkflowStepDto[];
}

export interface StepCandidateDto {
    id: string;
    displayName: string;
    excluded: boolean;
    excludedReason: string | null;
}

export interface ReviewErrorDto {
    code: string | null;
    message: string | null;
    data: unknown;
}

export interface ReviewEnvelope<T> {
    data: T | null;
    error: ReviewErrorDto | null;
}

export interface ReviewListEnvelope {
    data: ReviewWithFlagsDto[] | null;
    meta: ReviewListMeta | null;
    error: ReviewErrorDto | null;
}
```

`gateway/reviewFields.ts` (GraphQL fragments as plain strings; the field names are those of `WorkflowsReview`, `WorkflowsReviewStep`, `WorkflowsViewerFlags`, `WorkflowsWorkflow` in `WorkflowsSchemaFactory.ts`):

```ts
const ACTOR_FIELDS = /* GraphQL */ `
    type
    id
    displayName
    identityType
`;

export const ERROR_FIELDS = /* GraphQL */ `
    code
    message
    data
`;

export const REVIEW_FIELDS = /* GraphQL */ `
    id
    workflowId
    model
    targetId
    targetRevisionId
    title
    isActive
    state
    currentStepId
    currentStepState
    currentStepType
    currentOwnerId
    currentCandidateTeamIds
    targetContext {
        folder {
            id
            type
        }
        modelId
        title
        author {
            id
            displayName
        }
    }
    workflow {
        name
        models
    }
    steps {
        id
        title
        color
        description
        type
        state
        owner {
            ${ACTOR_FIELDS}
        }
        comment
        pickedUserId
        candidateTeamIds
        candidateTeams {
            id
            name
        }
        assignmentSource
        assignment {
            source
            ruleId
            reason
            by {
                ${ACTOR_FIELDS}
            }
        }
        reachedOn
        startedOn
        finishedOn
        taskId
        runs {
            taskId
            startedOn
            finishedOn
            outcome
            reason
        }
        issues {
            fieldPath
            severity
            message
            suggestion
        }
    }
    createdBy {
        ${ACTOR_FIELDS}
    }
    cancelledBy {
        ${ACTOR_FIELDS}
    }
    createdOn
    savedOn
    lastChangedOn
`;

/**
 * The assignment log of each step (D127), single reads only. Add it with
 * `steps { ${REVIEW_ASSIGNMENT_FIELDS} }` next to `REVIEW_FIELDS`: GraphQL merges the two `steps`
 * selections.
 */
export const REVIEW_ASSIGNMENT_FIELDS = /* GraphQL */ `
    assignments {
        id
        kind
        userId
        userDisplayName
        assignedOn
        source
        ruleId
        by {
            ${ACTOR_FIELDS}
        }
        reason
    }
`;

const VIEWER_FLAGS_FIELDS = /* GraphQL */ `
    canStart
    canTakeOver
    canApprove
    canReject
    canCancel
    canReassign
    canRestart
`;

/** List-safe: the review and the viewer flags, without the assignment log. */
export const REVIEW_WITH_FLAGS_FIELDS = /* GraphQL */ `
    review {
        ${REVIEW_FIELDS}
    }
    flags {
        ${VIEWER_FLAGS_FIELDS}
    }
`;

/** Single reads (`getTargetReview`, `getReview`): the review with the assignment log, and the flags. */
export const REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS = /* GraphQL */ `
    review {
        ${REVIEW_FIELDS}
        steps {
            ${REVIEW_ASSIGNMENT_FIELDS}
        }
    }
    flags {
        ${VIEWER_FLAGS_FIELDS}
    }
`;

export const WORKFLOW_FIELDS = /* GraphQL */ `
    id
    name
    models
    steps {
        id
        title
        color
        description
        type
        config
    }
`;

export const STEP_CANDIDATE_FIELDS = /* GraphQL */ `
    id
    displayName
    excluded
    excludedReason
`;

/** The `meta.system.workflow` selection on content lists (R213), shared by both apps. */
export const REVIEW_SYSTEM_WORKFLOW_SELECTION = "workflowId reviewState stepId stepName stepState";
```

Note: `~/features/graphqlFields.ts` (the old file, trimmed in Task 37 to `ERROR_FIELDS` and `WORKFLOW_FIELDS`) exports `ERROR_FIELDS` and `WORKFLOW_FIELDS` under the same names; the two files are separate modules and the barrel exports only the new ones.

`gateway/mapReview.ts`:

```ts
import type { ReviewActorDto } from "./dto.js";
import type { ReviewAssignmentEntryDto } from "./dto.js";
import type { ReviewDto } from "./dto.js";
import type { ReviewStepAssignmentDto } from "./dto.js";
import type { ReviewStepDto } from "./dto.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewActor } from "~/review/domain/types.js";
import type { ReviewAssignmentEntry } from "~/review/domain/types.js";
import type { ReviewStep } from "~/review/domain/types.js";
import type { ReviewStepAssignment } from "~/review/domain/types.js";

const mapActor = (dto: ReviewActorDto): ReviewActor => {
    return {
        type: dto.type,
        id: dto.id,
        displayName: dto.displayName,
        identityType: dto.identityType ?? null
    };
};

const mapOptionalActor = (dto: ReviewActorDto | null | undefined): ReviewActor | null => {
    return dto ? mapActor(dto) : null;
};

const mapAssignment = (dto: ReviewStepAssignmentDto | null | undefined): ReviewStepAssignment | null => {
    if (!dto) {
        return null;
    }
    return {
        source: dto.source,
        ruleId: dto.ruleId ?? null,
        reason: dto.reason ?? null,
        by: mapOptionalActor(dto.by)
    };
};

const mapAssignmentEntry = (dto: ReviewAssignmentEntryDto): ReviewAssignmentEntry => {
    return {
        id: dto.id,
        kind: dto.kind,
        userId: dto.userId ?? null,
        userDisplayName: dto.userDisplayName ?? null,
        assignedOn: dto.assignedOn,
        source: dto.source,
        ruleId: dto.ruleId ?? null,
        by: mapOptionalActor(dto.by),
        reason: dto.reason ?? null
    };
};

const mapStep = (dto: ReviewStepDto): ReviewStep => {
    return {
        id: dto.id,
        title: dto.title,
        color: dto.color,
        description: dto.description ?? null,
        type: dto.type,
        state: dto.state,
        owner: mapOptionalActor(dto.owner),
        comment: dto.comment ?? null,
        pickedUserId: dto.pickedUserId ?? null,
        candidateTeamIds: dto.candidateTeamIds ?? [],
        candidateTeams: (dto.candidateTeams ?? []).map(team => ({ id: team.id, name: team.name })),
        assignmentSource: dto.assignmentSource ?? null,
        assignment: mapAssignment(dto.assignment),
        reachedOn: dto.reachedOn ?? null,
        startedOn: dto.startedOn ?? null,
        finishedOn: dto.finishedOn ?? null,
        taskId: dto.taskId ?? null,
        runs: (dto.runs ?? []).map(run => ({
            taskId: run.taskId ?? null,
            startedOn: run.startedOn,
            finishedOn: run.finishedOn ?? null,
            outcome: run.outcome ?? null,
            reason: run.reason ?? null
        })),
        issues: (dto.issues ?? []).map(issue => ({
            fieldPath: issue.fieldPath ?? null,
            severity: issue.severity,
            message: issue.message,
            suggestion: issue.suggestion ?? null
        })),
        assignments: dto.assignments ? dto.assignments.map(mapAssignmentEntry) : null
    };
};

/**
 * Maps a `WorkflowsReview` to the domain `Review`: `model` becomes `namespace`,
 * `workflow.name` becomes `workflowName`. Pure.
 */
export const mapReview = (dto: ReviewDto): Review => {
    const folder = dto.targetContext.folder;
    return {
        id: dto.id,
        workflowId: dto.workflowId,
        namespace: dto.model,
        targetId: dto.targetId,
        targetRevisionId: dto.targetRevisionId,
        title: dto.title,
        isActive: dto.isActive,
        state: dto.state,
        currentStepId: dto.currentStepId ?? null,
        currentStepType: dto.currentStepType ?? null,
        currentOwnerId: dto.currentOwnerId ?? null,
        currentStepState: dto.currentStepState ?? null,
        currentCandidateTeamIds: dto.currentCandidateTeamIds ?? [],
        targetContext: {
            folder: folder ? { id: folder.id, type: folder.type } : null,
            modelId: dto.targetContext.modelId,
            title: dto.targetContext.title,
            author: {
                id: dto.targetContext.author.id,
                displayName: dto.targetContext.author.displayName
            }
        },
        workflowName: dto.workflow.name,
        steps: dto.steps.map(mapStep),
        createdBy: mapActor(dto.createdBy),
        cancelledBy: mapOptionalActor(dto.cancelledBy),
        createdOn: dto.createdOn,
        savedOn: dto.savedOn,
        lastChangedOn: dto.lastChangedOn
    };
};
```

`gateway/mapReviewWithFlags.ts`:

```ts
import type { ReviewWithFlagsDto } from "./dto.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import { mapReview } from "./mapReview.js";

export const mapReviewWithFlags = (dto: ReviewWithFlagsDto): ReviewWithFlags => {
    return {
        review: mapReview(dto.review),
        flags: {
            canStart: dto.flags.canStart,
            canTakeOver: dto.flags.canTakeOver,
            canApprove: dto.flags.canApprove,
            canReject: dto.flags.canReject,
            canCancel: dto.flags.canCancel,
            canReassign: dto.flags.canReassign,
            canRestart: dto.flags.canRestart
        }
    };
};
```

`gateway/mapWorkflow.ts`:

```ts
import type { WorkflowDto } from "./dto.js";
import type { WorkflowStepDto } from "./dto.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { ReviewWorkflowStep } from "~/review/domain/types.js";

const REVIEW_STEP_TYPE = "review";

const readAssignment = (type: string, config: unknown): object | null => {
    if (type !== REVIEW_STEP_TYPE) {
        return null;
    }
    if (typeof config !== "object" || config === null || !("assignment" in config)) {
        return null;
    }
    const assignment = config.assignment;
    if (typeof assignment !== "object" || assignment === null) {
        return null;
    }
    return assignment;
};

/**
 * Mirror of `canPickReviewer` in api-workflows: a manual pick is possible for a review step whose
 * config sets `assignment.allowManualPick` to `true` (R218).
 */
const readAllowManualPick = (type: string, config: unknown): boolean => {
    const assignment = readAssignment(type, config);
    if (!assignment || !("allowManualPick" in assignment)) {
        return false;
    }
    return assignment.allowManualPick === true;
};

/**
 * A review step whose `assignment.strategy` is anything but `none` (`roundRobin`, `leastLoaded`)
 * picks its reviewer itself (R246); a missing or unreadable config is not automatic.
 */
const readAssignedAutomatically = (type: string, config: unknown): boolean => {
    const assignment = readAssignment(type, config);
    if (!assignment || !("strategy" in assignment)) {
        return false;
    }
    return typeof assignment.strategy === "string" && assignment.strategy !== "none";
};

const mapStep = (dto: WorkflowStepDto): ReviewWorkflowStep => {
    return {
        id: dto.id,
        title: dto.title,
        color: dto.color,
        description: dto.description ?? null,
        type: dto.type,
        allowManualPick: readAllowManualPick(dto.type, dto.config),
        assignedAutomatically: readAssignedAutomatically(dto.type, dto.config)
    };
};

/** Maps a `WorkflowsWorkflow`: `models` (the bound namespaces) becomes `namespaces`. */
export const mapWorkflow = (dto: WorkflowDto): ReviewWorkflow => {
    return {
        id: dto.id,
        name: dto.name,
        namespaces: dto.models,
        steps: dto.steps.map(mapStep)
    };
};
```

`gateway/mapStepCandidate.ts`:

```ts
import type { StepCandidateDto } from "./dto.js";
import type { StepCandidate } from "~/review/domain/types.js";

export const mapStepCandidate = (dto: StepCandidateDto): StepCandidate => {
    return {
        id: dto.id,
        displayName: dto.displayName,
        excluded: dto.excluded,
        excludedReason: dto.excludedReason ?? null
    };
};
```

`gateway/IReviewGateway.ts`:

```ts
import type { ReviewEnvelope } from "./dto.js";
import type { ReviewDto } from "./dto.js";
import type { ReviewListEnvelope } from "./dto.js";
import type { ReviewWithFlagsDto } from "./dto.js";
import type { StepCandidateDto } from "./dto.js";
import type { WorkflowDto } from "./dto.js";
import type { ReviewForDeleteAction } from "~/review/domain/types.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { ReviewListKind } from "~/review/domain/ReviewListKind.js";
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";

export interface ListStepCandidatesParams {
    workflowId: string;
    stepId: string;
    target: ReviewTarget;
}

export interface ListReviewStepCandidatesParams {
    reviewId: string;
    stepId: string;
}

export interface ReviewStepRef {
    reviewId: string;
    stepId: string;
}

export interface RequestReviewPick {
    stepId: string;
    userId: string;
}

export interface RequestReviewParams {
    target: ReviewTarget;
    title: string;
    picks: RequestReviewPick[];
}

export interface TakeOverReviewParams extends ReviewStepRef {
    notifyPreviousOwner: boolean;
}

export interface ReassignReviewParams extends ReviewStepRef {
    userId: string;
}

export interface ApproveReviewParams extends ReviewStepRef {
    comment: string | null;
}

export interface RejectReviewParams extends ReviewStepRef {
    comment: string;
}

export interface CancelReviewParams {
    reviewId: string;
}

export interface ReviewListWhere {
    modelId?: string;
    titleContains?: string;
    reviewState?: ReviewStateValue;
    stepState?: StepStateValue;
}

export interface ListReviewsParams {
    list: ReviewListKind;
    where: ReviewListWhere;
    sort: ReviewListSort;
    limit: number;
    after: string | null;
}

export interface CancelForDeleteParams {
    namespace: string;
    targetId: string;
    targetRevisionId: string | null;
    action: ReviewForDeleteAction;
}

/**
 * The review operations one app exposes over its own GraphQL documents (R202). Every method
 * resolves with the shared envelope, also when the server reports an error, and rejects only on a
 * transport failure (R204). There is no abstraction token here: each app creates its own over this
 * interface.
 */
export interface IReviewGateway {
    listWorkflows(): Promise<ReviewEnvelope<WorkflowDto[]>>;
    getTargetReview(target: ReviewTarget): Promise<ReviewEnvelope<ReviewWithFlagsDto | null>>;
    getReview(reviewId: string): Promise<ReviewEnvelope<ReviewWithFlagsDto>>;
    listStepCandidates(params: ListStepCandidatesParams): Promise<ReviewEnvelope<StepCandidateDto[]>>;
    listReviewStepCandidates(
        params: ListReviewStepCandidatesParams
    ): Promise<ReviewEnvelope<StepCandidateDto[]>>;
    listReviews(params: ListReviewsParams): Promise<ReviewListEnvelope>;
    requestReview(params: RequestReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    startStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>>;
    takeOverStep(params: TakeOverReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    reassignStep(params: ReassignReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    approveStep(params: ApproveReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    rejectStep(params: RejectReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    cancelReview(params: CancelReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    cancelForDelete(params: CancelForDeleteParams): Promise<ReviewEnvelope<ReviewDto[]>>;
}
```

`useCases/IReviewReadUseCases.ts`:

```ts
import type { ListReviewStepCandidatesParams } from "~/review/gateway/IReviewGateway.js";
import type { ListStepCandidatesParams } from "~/review/gateway/IReviewGateway.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { StepCandidate } from "~/review/domain/types.js";

export interface IReviewReadUseCases {
    getBoundWorkflow(namespace: string): Promise<ReviewWorkflow | null>;
    getTargetReview(target: ReviewTarget): Promise<ReviewWithFlags | null>;
    getReview(reviewId: string): Promise<ReviewWithFlags>;
    listStepCandidates(params: ListStepCandidatesParams): Promise<StepCandidate[]>;
    listReviewStepCandidates(params: ListReviewStepCandidatesParams): Promise<StepCandidate[]>;
}
```

`useCases/IReviewActionUseCases.ts`:

```ts
import type { ApproveReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { CancelReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { ReassignReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { RejectReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { RequestReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { ReviewStepRef } from "~/review/gateway/IReviewGateway.js";
import type { TakeOverReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface IReviewActionUseCases {
    requestReview(params: RequestReviewParams): Promise<Review>;
    startStep(params: ReviewStepRef): Promise<Review>;
    takeOverStep(params: TakeOverReviewParams): Promise<Review>;
    reassignStep(params: ReassignReviewParams): Promise<Review>;
    approveStep(params: ApproveReviewParams): Promise<Review>;
    rejectStep(params: RejectReviewParams): Promise<Review>;
    cancelReview(params: CancelReviewParams): Promise<Review>;
}
```

`useCases/IReviewListUseCases.ts`:

```ts
import type { ListReviewsParams } from "~/review/gateway/IReviewGateway.js";
import type { ReviewListMeta } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";

export interface ReviewListPage {
    items: ReviewWithFlags[];
    meta: ReviewListMeta;
}

export interface IReviewListUseCases {
    listReviews(params: ListReviewsParams): Promise<ReviewListPage>;
}
```

`useCases/IReviewCancelForDeleteUseCases.ts`:

```ts
import type { CancelForDeleteParams } from "~/review/gateway/IReviewGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface IReviewCancelForDeleteUseCases {
    cancelForDelete(params: CancelForDeleteParams): Promise<Review[]>;
}
```

`useCases/IReviewUseCases.ts`:

```ts
import type { IReviewActionUseCases } from "./IReviewActionUseCases.js";
import type { IReviewCancelForDeleteUseCases } from "./IReviewCancelForDeleteUseCases.js";
import type { IReviewListUseCases } from "./IReviewListUseCases.js";
import type { IReviewReadUseCases } from "./IReviewReadUseCases.js";

/**
 * Everything the review views need from one app. Every method throws a `GraphQLOperationError` for a
 * server error or the transport `Error` as is (R204).
 */
export interface IReviewUseCases
    extends
        IReviewReadUseCases,
        IReviewActionUseCases,
        IReviewListUseCases,
        IReviewCancelForDeleteUseCases {}
```

`content/IReviewContentAdapter.ts`:

```ts
export interface ReviewContentRef {
    namespace: string;
    targetId: string;
    targetRevisionId: string;
    contentTypeId: string | null;
}

/**
 * The only per-app content knowledge besides gateways and cache writers (R224). Built from route
 * path strings, no hooks, so handlers can use it.
 */
export interface IReviewContentAdapter {
    canHandle(namespace: string): boolean;
    getContentUrl(ref: ReviewContentRef): string;
    getContentTypeLabel(contentTypeId: string): string | null;
}
```

`cache/IReviewCacheWriter.ts`:

```ts
import type { SystemWorkflowValue } from "~/review/domain/types.js";

export interface ReviewCacheRef {
    namespace: string;
    targetId: string;
    targetRevisionId: string;
}

/** Writes `meta.system.workflow` into an app's content list cache (R213). */
export interface IReviewCacheWriter {
    canHandle(namespace: string): boolean;
    write(ref: ReviewCacheRef, workflow: SystemWorkflowValue | null): void;
}
```

This task does not touch the barrel `packages/app-workflows/src/index.tsx` (R-k: no export is added that nothing consumes). The old `features/graphqlFields.ts` stays as is, and the generic `ERROR_FIELDS`, `WORKFLOW_FIELDS` and `STEP_CANDIDATE_FIELDS` stay internal to `app-workflows`: the app packages import `app-workflows` through deep paths (`@webiny/app-workflows/review/gateway/reviewFields.js`).

- [ ] **Step 4: Run the tests and expect pass**

```bash
yarn test packages/app-workflows/src/review/domain/isReviewSelectable.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/domain/toSystemWorkflow.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/domain/toReviewListRow.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/gateway/mapReview.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/gateway/mapReviewWithFlags.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/gateway/mapWorkflow.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/gateway/mapStepCandidate.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/__tests__/reviewFields.test.ts 2>&1 | tail -50
```

Expected: all PASS. If a mapper test fails on the `candidateTeams: undefined` case, the mapper must keep `(dto.candidateTeams ?? [])` (a server without Task 1 deployed omits the field). If `reviewFields.test.ts` fails on a regex, print the fragment and fix the fragment, not the test.

- [ ] **Step 5: Existing tests and type check**

`app-workflows` had no tests before this task, and nothing in the package imports the new files yet, so there are no existing tests covering the changed code. Type check and build:

```bash
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: no type errors from the script (it only reports `__tests__/`, here `reviewFields.test.ts`) and none from the build, which type-checks the co-located tests and the fixtures (in particular, `mapWorkflow.ts` narrows `config` with `in` checks and needs no cast, and the `ReviewActorDto.type` union flows into `ReviewActor`); the package builds.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the review domain, DTOs, fragments, mappers and gateway interfaces" -m "Adds the vitest setup of app-workflows (A75: runner starts, co-located tests discovered), the review domain types, the shared Workflows DTOs and field fragments (candidateTeams, userDisplayName and cancelledBy selected), the review, workflow and candidate mappers (with assignedAutomatically, userDisplayName and cancelledBy), toSystemWorkflow, toReviewListRow, isReviewSelectable, and the gateway, use-case, content adapter and cache writer interfaces." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step fails and you fix something, rerun the chain from the top. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`. Never push or amend.

**Contract notes**

- `@webiny/di` (dependency) is added in Task 9, the first task whose test imports it (`yarn adio` flags a used but undeclared dependency); `@testing-library/react` (devDependency) is added in Task 10, where the first component test needs it. Neither is needed by Task 8.
- Barrel: the contract says Task 8 modifies `index.tsx` with "additions named in Task 10"; that is dropped (R-k): the app packages import `app-workflows` through deep paths contract-wide and nothing imports the new names through the bare barrel, so no task of 8a adds a barrel export (Task 37 only removes the old entries).
- Added beyond the contract (names the contract does not give, all additive): `ReviewActorType`, `ReviewForDeleteAction`, `ReviewTargetFolder`, `ReviewTargetAuthor` (aliases for repeated unions and inline objects), the DTO helper interfaces (`ReviewActorDto`, `ReviewStepAssignmentDto`, `ReviewAssignmentEntryDto`, `ReviewStepRunDto`, `ReviewAiIssueDto`, `ReviewCandidateTeamDto`, `ReviewTargetContextDto`, `ReviewWorkflowRefDto`, `ViewerFlagsDto`, `WorkflowStepDto`), `REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS` (the single-read selection, so the two apps do not each compose the `steps` merge), `ReviewListMeta` (a domain type in `types.ts`, used by the DTO envelope and the list use case), `ReviewAssignmentEntry.assignedOn` (the shared type has it; the contract's list omits it), and the test helper module `src/review/testing/reviewFixtures.ts`.
- Nullability: the contract writes `reachedOn; startedOn; finishedOn: string | null`; the shared schema has all three nullable (`reachedOn: DateTime`, `startedOn: DateTime`, `finishedOn: DateTime` without `!`), so all three are `string | null`.
- `ReviewListKind` and `ReviewListSort` are plain string-union types (the contract lists only their values), `ReviewState` and `StepState` are const objects with a `...Value` type as the contract names.
- `WorkflowsWorkflow` exposes `models`, not `namespaces`; the mapper renames it. `WorkflowDto.config` is JSON (`unknown`) and only `assignment.allowManualPick` and `assignment.strategy` of a `review` step are read; `assignedAutomatically` is true only for a string strategy other than `none` (a missing or unreadable config is not automatic, R246).
- `yarn check:test:types -p app-workflows` only lists packages with a `__tests__/**/*.test.ts` file (`scripts/utils/getPackages.js` `hasTests`), so co-located tests alone would give "No matching packages found". `reviewFields.test.ts` therefore lives in `packages/app-workflows/__tests__/` (R243). The script keeps only errors inside `__tests__/` (`scripts/typecheckTests/typecheckPackage.ts`), so for the co-located tests the type check is `yarn build -p @webiny/app-workflows --no-cache` (R-e, Global Constraints), which also covers the fixtures. The fixtures live in `src/review/testing/` and not in `__tests__/` (TS6059, R243), so the build type-checks them.
- The `cancelledBy` selection reuses the full actor fragment (`type id displayName identityType`, a superset of the contract's `cancelledBy { id displayName }`) so the mapper returns a complete `ReviewActor` for `Review.cancelledBy`.
- Size: large (about 40 files) but all pure and mechanical; one test cycle, one review gate.
