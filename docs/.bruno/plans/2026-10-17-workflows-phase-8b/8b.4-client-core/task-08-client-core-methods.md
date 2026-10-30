### Task 8: Client DTOs, fragments, mappers, gateway interface and use cases

R202, R204, R238, R243, R257 (client mirror), R265 (client side), R266 (`TargetSync`); D161, D164; Review Focus 2 (the client mirrors only the `ReviewStepRunInfo` fields), 9 (`BlockingReview` mapping). This task adds the three new operations to everything `app-workflows` shares and knows no app: the gateway interface, the DTOs, the fragments, the mappers, the use-case interfaces, the one shared `ReviewUseCases` implementation, the test fakes and the fixtures. It adds no presenter, no component and no app code. Global Constraints of 8a and 8b apply (read them); this task has no flag-gated registration, so it adds no composition-root test.

- **Gateway interface** (`IReviewGateway`): `restartStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>>` (the existing `ReviewStepRef { reviewId; stepId }` is the parameter, no new type), `getStepRun(params: GetStepRunParams): Promise<ReviewEnvelope<ReviewStepRunInfoDto | null>>`, `listBlockingReviews(params: ListBlockingReviewsParams): Promise<ReviewEnvelope<BlockingReviewDto[]>>`. New parameter types in the same file: `GetStepRunParams { reviewId: string; stepId: string; taskId: string }`, `ListBlockingReviewsParams { namespace: string; targetIds: string[] }`.
- **DTOs** (`gateway/dto.ts`): `ReviewStepRunInfoDto { taskId: string; status: string; startedOn: string | null; finishedOn: string | null; iterations: number; outcome: string | null; reason: string | null }` (the wire type is `String`, the mapper narrows it) and `BlockingReviewDto { reviewId; model; targetId; targetRevisionId; title; stepPosition: number; stepCount: number; stepName }` (the fields of the server's `WorkflowsBlockingReview`, R265).
- **Domain** (`domain/types.ts`, `domain/StepRunTaskStatus.ts`): `ReviewStepRunInfo` has the same fields as the DTO with `status: StepRunTaskStatus`. `StepRunTaskStatus` is the union `"pending" | "running" | "done" | "failed" | "aborted"` of R257 (the API's name, mirrored). `BlockingReview` already exists (`domain/types.ts`, built by the 8a trash flow straight from the refusal data); the new mapper builds it from the DTO.
- **Fragments** (`gateway/reviewFields.ts`): `STEP_RUN_INFO_FIELDS` selects exactly the seven fields of the DTO (R146/R257: never `input`, `output`, `logs`, `error`); `BLOCKING_REVIEW_FIELDS` selects the eight blocking-review fields. Both are exported for Task 9's documents.
- **Mappers:** `mapStepRunInfo(dto)` maps every field, turns an absent `startedOn`, `finishedOn`, `outcome` or `reason` into `null` (the 8a `?? null` rule), and **throws** `Error("Unknown step run status: <value>.")` for a status outside the union. The server maps the five task statuses itself (R257), so an unknown value means the two sides disagree; a visible failure (Task 15 catches it as a plain `Error`, so the panel shows the generic "The server did not respond. Try again in a moment." text) is better than showing a wrong status. `mapBlockingReview(dto)` copies the eight fields.
- **Error codes** (`domain/ReviewErrorCode.ts`): `TargetSync: "Workflows/Review/TargetSync"` (R266: the review was saved, the content sync failed; Task 11 treats it as a restart success) and `StepRunNotFound: "Workflows/Review/StepRunNotFound"` (R257; Task 15 shows the generic task error for it).
- **Use cases:** `IReviewActionUseCases.restartStep(params: ReviewStepRef): Promise<Review>`; `IReviewReadUseCases.getStepRun(params: GetStepRunParams): Promise<ReviewStepRunInfo | null>` (a `null` envelope data is the "task is gone" answer and passes through as `null`, an error envelope throws); `IReviewCancelForDeleteUseCases.listBlockingReviews(params: ListBlockingReviewsParams): Promise<BlockingReview[]>` (the contract's place; it is the interface the shared guard and Task 19's decorator already receive). `ReviewUseCases` implements the three exactly like its neighbours: an error envelope (or, for `restartStep` and `listBlockingReviews`, an envelope without data) becomes a `GraphQLOperationError` with the code and data of the error and the message `The request failed.` as fallback (R204), a transport error passes.
- **Fakes and fixtures (R243):** `fakeReviewUseCases.ts` gains `restartStep` (resolves the default review), `getStepRun` (resolves `null`) and `listBlockingReviews` (resolves `[]`), 17 mocks in all. `reviewFixtures.ts` gains the DTO builders `createStepRunInfoDto`, `createBlockingReviewDto` (named by the contract) and the domain builders `createStepRunInfo`, `createBlockingReview` (Tasks 14, 15 and 19 need them; pure data, no vitest import).
- **Compile break outside this package, on purpose:** adding `listBlockingReviews` to `IReviewCancelForDeleteUseCases` makes every test double of that interface incomplete. The three in `app-workflows` are fixed in this task (Step 3, hunk H); the nine in the CMS and WB packages are fixed in Task 9, which also adds the two gateway methods. After this task the CMS and WB gateway classes do not compile until Task 9; Tasks 8 and 9 are committed in order and this task's verification is the `app-workflows` tests, `check:test:types` and build only.

**Files:**
- Create: `packages/app-workflows/src/review/domain/StepRunTaskStatus.ts`
- Create: `packages/app-workflows/src/review/domain/ReviewErrorCode.test.ts`
- Create: `packages/app-workflows/src/review/gateway/mapStepRunInfo.ts`
- Create: `packages/app-workflows/src/review/gateway/mapStepRunInfo.test.ts`
- Create: `packages/app-workflows/src/review/gateway/mapBlockingReview.ts`
- Create: `packages/app-workflows/src/review/gateway/mapBlockingReview.test.ts`
- Modify: `packages/app-workflows/src/review/gateway/IReviewGateway.ts`
- Modify: `packages/app-workflows/src/review/gateway/dto.ts`
- Modify: `packages/app-workflows/src/review/gateway/reviewFields.ts`
- Modify: `packages/app-workflows/src/review/domain/types.ts`
- Modify: `packages/app-workflows/src/review/domain/ReviewErrorCode.ts`
- Modify: `packages/app-workflows/src/review/useCases/IReviewActionUseCases.ts`
- Modify: `packages/app-workflows/src/review/useCases/IReviewReadUseCases.ts`
- Modify: `packages/app-workflows/src/review/useCases/IReviewCancelForDeleteUseCases.ts`
- Modify: `packages/app-workflows/src/review/useCases/ReviewUseCases.ts`
- Modify: `packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts`
- Modify: `packages/app-workflows/src/review/testing/fakeReviewUseCases.ts`
- Modify: `packages/app-workflows/src/review/testing/reviewFixtures.ts`
- Modify: `packages/app-workflows/__tests__/reviewFields.test.ts`
- Modify: `packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts`
- Modify: `packages/app-workflows/src/review/trash/ActiveReviewTrashFeature.test.tsx`

**Interfaces:**
- Consumes (verified with codegraph and the files): `IReviewGateway`, `ReviewStepRef`, `CancelForDeleteParams` (`~/review/gateway/IReviewGateway.js`); `ReviewEnvelope`, `ReviewDto` (`~/review/gateway/dto.js`); `Review`, `BlockingReview` (`~/review/domain/types.js`); `GraphQLOperationError` (`@webiny/app/errors/index.js`); `mapReview` (`~/review/gateway/mapReview.js`); the fixtures `T1`, `T2`, `createReviewDto` (`~/review/testing/reviewFixtures.js`); the 8a test helpers.
- Produces (matches the contract):
  - `IReviewGateway.restartStep`, `.getStepRun`, `.listBlockingReviews`, `GetStepRunParams`, `ListBlockingReviewsParams`.
  - `ReviewStepRunInfoDto`, `BlockingReviewDto`; `ReviewStepRunInfo`, `StepRunTaskStatus` (value object and union under one name); `STEP_RUN_INFO_FIELDS`, `BLOCKING_REVIEW_FIELDS`; `mapStepRunInfo`, `mapBlockingReview`.
  - `ReviewErrorCode.TargetSync`, `ReviewErrorCode.StepRunNotFound`.
  - `IReviewActionUseCases.restartStep`, `IReviewReadUseCases.getStepRun`, `IReviewCancelForDeleteUseCases.listBlockingReviews` and their `ReviewUseCases` implementation.
  - `FakeReviewUseCases` with the three new mocks; `createStepRunInfoDto`, `createBlockingReviewDto`, `createStepRunInfo`, `createBlockingReview`.
  - Consumed by Task 9 (gateway methods), Task 11 (`restartStep`), Tasks 14-15 (`getStepRun`, `ReviewStepRunInfo`, `StepRunTaskStatus`, the fixtures), Task 19 (`listBlockingReviews`).

**Test runner note:** admin package, `yarn test <path>` only. The package has `__tests__/reviewFields.test.ts`, so `yarn check:test:types -p app-workflows` applies; the co-located tests are type-checked by the build.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/review/domain/ReviewErrorCode.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ReviewErrorCode } from "./ReviewErrorCode.js";

describe("ReviewErrorCode", () => {
    it("pins the two codes 8b adds to the server's strings (R257, R266)", () => {
        expect(ReviewErrorCode.TargetSync).toBe("Workflows/Review/TargetSync");
        expect(ReviewErrorCode.StepRunNotFound).toBe("Workflows/Review/StepRunNotFound");
    });
});
```

Create `packages/app-workflows/src/review/gateway/mapStepRunInfo.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapStepRunInfo } from "./mapStepRunInfo.js";
import { StepRunTaskStatus } from "~/review/domain/StepRunTaskStatus.js";
import { T1 } from "~/review/testing/reviewFixtures.js";
import { T2 } from "~/review/testing/reviewFixtures.js";
import { createStepRunInfoDto } from "~/review/testing/reviewFixtures.js";

describe("mapStepRunInfo", () => {
    it("maps every field", () => {
        const info = mapStepRunInfo(
            createStepRunInfoDto({
                taskId: "task-7",
                status: "failed",
                startedOn: T1,
                finishedOn: T2,
                iterations: 3,
                outcome: "failed",
                reason: "The step could not run."
            })
        );

        expect(info).toEqual({
            taskId: "task-7",
            status: "failed",
            startedOn: T1,
            finishedOn: T2,
            iterations: 3,
            outcome: "failed",
            reason: "The step could not run."
        });
    });

    it("keeps null times, outcome and reason (a task that has not finished)", () => {
        const info = mapStepRunInfo(
            createStepRunInfoDto({
                status: "running",
                startedOn: null,
                finishedOn: null,
                outcome: null,
                reason: null
            })
        );

        expect(info.startedOn).toBeNull();
        expect(info.finishedOn).toBeNull();
        expect(info.outcome).toBeNull();
        expect(info.reason).toBeNull();
    });

    it.each(Object.values(StepRunTaskStatus))("accepts the status %s", status => {
        const info = mapStepRunInfo(createStepRunInfoDto({ status }));

        expect(info.status).toBe(status);
    });

    it("throws for a status outside the union instead of showing a wrong one", () => {
        expect(() => mapStepRunInfo(createStepRunInfoDto({ status: "success" }))).toThrow(
            "Unknown step run status: success."
        );
    });
});
```

Create `packages/app-workflows/src/review/gateway/mapBlockingReview.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { mapBlockingReview } from "./mapBlockingReview.js";
import { createBlockingReviewDto } from "~/review/testing/reviewFixtures.js";

describe("mapBlockingReview", () => {
    it("maps the eight fields of a review in progress", () => {
        const review = mapBlockingReview(
            createBlockingReviewDto({
                reviewId: "review-4",
                model: "cms.article",
                targetId: "entry-4",
                targetRevisionId: "entry-4#0003",
                title: "Launch article",
                stepPosition: 2,
                stepCount: 3,
                stepName: "Legal sign-off"
            })
        );

        expect(review).toEqual({
            reviewId: "review-4",
            model: "cms.article",
            targetId: "entry-4",
            targetRevisionId: "entry-4#0003",
            title: "Launch article",
            stepPosition: 2,
            stepCount: 3,
            stepName: "Legal sign-off"
        });
    });
});
```

Modify `packages/app-workflows/__tests__/reviewFields.test.ts`. Add two imports after the `REVIEW_WITH_FLAGS_FIELDS` import:

```ts
import { BLOCKING_REVIEW_FIELDS } from "~/review/gateway/reviewFields.js";
import { STEP_RUN_INFO_FIELDS } from "~/review/gateway/reviewFields.js";
```

In `it("keeps every selection balanced"`, add both constants to the `selections` array:

```ts
        const selections = [
            ERROR_FIELDS,
            REVIEW_ASSIGNMENT_FIELDS,
            REVIEW_FIELDS,
            REVIEW_WITH_FLAGS_FIELDS,
            REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS,
            STEP_CANDIDATE_FIELDS,
            WORKFLOW_FIELDS,
            STEP_RUN_INFO_FIELDS,
            BLOCKING_REVIEW_FIELDS
        ];
```

Append before the final `});` of `describe("reviewFields", ...)`:

```ts

    it("selects exactly the seven fields of the step run info and nothing raw (R146, R257)", () => {
        expect(words(STEP_RUN_INFO_FIELDS)).toEqual([
            "taskId",
            "status",
            "startedOn",
            "finishedOn",
            "iterations",
            "outcome",
            "reason"
        ]);
    });

    it("selects the eight fields of a blocking review (R265)", () => {
        expect(words(BLOCKING_REVIEW_FIELDS)).toEqual([
            "reviewId",
            "model",
            "targetId",
            "targetRevisionId",
            "title",
            "stepPosition",
            "stepCount",
            "stepName"
        ]);
    });
```

Modify `packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts`.

Hunk A, imports: after `import type { CancelReviewParams } from "~/review/gateway/IReviewGateway.js";` add `import type { GetStepRunParams } from "~/review/gateway/IReviewGateway.js";` and after `import type { ListReviewStepCandidatesParams } ...;` add `import type { ListBlockingReviewsParams } from "~/review/gateway/IReviewGateway.js";`. After `import { createReviewWithFlagsDto } ...` add:

```ts
import { createBlockingReviewDto } from "~/review/testing/reviewFixtures.js";
import { createStepRunInfoDto } from "~/review/testing/reviewFixtures.js";
```

Hunk B, `createFakeGateway`:

```ts
// before
        cancelReview: vi.fn(),
        cancelForDelete: vi.fn()
    };
};

const createWorkflowDto

// after
        cancelReview: vi.fn(),
        restartStep: vi.fn(),
        cancelForDelete: vi.fn(),
        getStepRun: vi.fn(),
        listBlockingReviews: vi.fn()
    };
};

const createWorkflowDto
```

Hunk C, parameters (after `const cancelParams: CancelReviewParams = { reviewId: "review-1" };`):

```ts
const stepRunParams: GetStepRunParams = { ...stepRef, taskId: "task-1" };
const blockingParams: ListBlockingReviewsParams = {
    namespace: "cms.article",
    targetIds: ["entry-1", "entry-2"]
};
```

Hunk D, the action table: add `"restartStep"` to the `ActionMethod` union (after `| "cancelReview"` becomes `| "cancelReview"\n    | "restartStep"`), and a case at the end of `actionCases`:

```ts
// before
    {
        method: "cancelReview",
        params: cancelParams,
        run: useCases => useCases.cancelReview(cancelParams)
    }
];

// after
    {
        method: "cancelReview",
        params: cancelParams,
        run: useCases => useCases.cancelReview(cancelParams)
    },
    {
        method: "restartStep",
        params: stepRef,
        run: useCases => useCases.restartStep(stepRef)
    }
];
```

Hunk E, the operation table (R204 error mapping runs over it): add after the `cancelForDelete` entry:

```ts
// before
    {
        name: "cancelForDelete",
        method: "cancelForDelete",
        run: useCases => useCases.cancelForDelete(cancelForDeleteParams)
    }
];

// after
    {
        name: "cancelForDelete",
        method: "cancelForDelete",
        run: useCases => useCases.cancelForDelete(cancelForDeleteParams)
    },
    {
        name: "getStepRun",
        method: "getStepRun",
        run: useCases => useCases.getStepRun(stepRunParams)
    },
    {
        name: "listBlockingReviews",
        method: "listBlockingReviews",
        run: useCases => useCases.listBlockingReviews(blockingParams)
    }
];
```

Hunk F, two new `describe` blocks, inserted before `describe("per-app subclasses (one container, two apps)", ...`:

```ts
    describe("getStepRun", () => {
        it("passes the ids and maps the info of the task", async () => {
            gateway.getStepRun.mockResolvedValue({
                data: createStepRunInfoDto({ taskId: "task-1", status: "done", iterations: 2 }),
                error: null
            });

            const result = await useCases.getStepRun(stepRunParams);

            expect(gateway.getStepRun).toHaveBeenCalledWith(stepRunParams);
            expect(result).toMatchObject({ taskId: "task-1", status: "done", iterations: 2 });
        });

        it("returns null when the task is gone (data null, no error)", async () => {
            gateway.getStepRun.mockResolvedValue({ data: null, error: null });

            await expect(useCases.getStepRun(stepRunParams)).resolves.toBeNull();
        });

        it("throws a GraphQLOperationError with the code and data of the error envelope", async () => {
            gateway.getStepRun.mockResolvedValue({
                data: null,
                error: {
                    code: "Workflows/Review/StepRunNotFound",
                    message: "The step run was not found.",
                    data: { reviewId: "review-1", stepId: "step-1", taskId: "task-1" }
                }
            });

            const failure = (await useCases
                .getStepRun(stepRunParams)
                .catch(error => error)) as GraphQLOperationError;

            expect(failure).toBeInstanceOf(GraphQLOperationError);
            expect(failure.code).toBe("Workflows/Review/StepRunNotFound");
            expect(failure.data).toEqual({
                reviewId: "review-1",
                stepId: "step-1",
                taskId: "task-1"
            });
        });
    });

    describe("listBlockingReviews", () => {
        it("passes the namespace and ids and maps every review", async () => {
            gateway.listBlockingReviews.mockResolvedValue({
                data: [
                    createBlockingReviewDto({ reviewId: "review-1", targetId: "entry-1" }),
                    createBlockingReviewDto({ reviewId: "review-2", targetId: "entry-2" })
                ],
                error: null
            });

            const result = await useCases.listBlockingReviews(blockingParams);

            expect(gateway.listBlockingReviews).toHaveBeenCalledWith(blockingParams);
            expect(result.map(review => review.reviewId)).toEqual(["review-1", "review-2"]);
            expect(result[1].targetId).toBe("entry-2");
        });

        it("returns an empty list when no review blocks", async () => {
            gateway.listBlockingReviews.mockResolvedValue({ data: [], error: null });

            await expect(useCases.listBlockingReviews(blockingParams)).resolves.toEqual([]);
        });

        it("throws when the server answers with neither data nor error", async () => {
            gateway.listBlockingReviews.mockResolvedValue({ data: null, error: null });

            await expect(useCases.listBlockingReviews(blockingParams)).rejects.toMatchObject({
                name: "GraphQLOperationError",
                message: "The request failed.",
                code: null
            });
        });
    });
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
yarn test packages/app-workflows/src/review/domain/ReviewErrorCode.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/gateway/mapStepRunInfo.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/gateway/mapBlockingReview.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/__tests__/reviewFields.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts 2>&1 | tail -40
```

Expected: `ReviewErrorCode.test.ts` fails (`undefined` is not `Workflows/Review/TargetSync`); the two mapper tests fail with `Failed to resolve import "./mapStepRunInfo.js"` and `"./mapBlockingReview.js"`; `reviewFields.test.ts` fails on the two new selections (`STEP_RUN_INFO_FIELDS` is not exported, `words(undefined)` throws); `ReviewUseCases.test.ts` fails on the new fixture imports and `useCases.restartStep is not a function`.

- [ ] **Step 3: Implementation**

Create `packages/app-workflows/src/review/domain/StepRunTaskStatus.ts`:

```ts
/*
 * The status of a step's background task as `getStepRun` reports it (R257). The API maps its task
 * statuses to these five (`success` becomes `done`); this is the client's mirror of that union.
 * The value object and the union share one name, as the contract names the union.
 */
export const StepRunTaskStatus = {
    Pending: "pending",
    Running: "running",
    Done: "done",
    Failed: "failed",
    Aborted: "aborted"
} as const;

export type StepRunTaskStatus = (typeof StepRunTaskStatus)[keyof typeof StepRunTaskStatus];
```

Create `packages/app-workflows/src/review/gateway/mapStepRunInfo.ts`:

```ts
import type { ReviewStepRunInfoDto } from "./dto.js";
import type { ReviewStepRunInfo } from "~/review/domain/types.js";
import { StepRunTaskStatus } from "~/review/domain/StepRunTaskStatus.js";

const toStatus = (value: string): StepRunTaskStatus => {
    if (value === StepRunTaskStatus.Pending) {
        return StepRunTaskStatus.Pending;
    }
    if (value === StepRunTaskStatus.Running) {
        return StepRunTaskStatus.Running;
    }
    if (value === StepRunTaskStatus.Done) {
        return StepRunTaskStatus.Done;
    }
    if (value === StepRunTaskStatus.Failed) {
        return StepRunTaskStatus.Failed;
    }
    if (value === StepRunTaskStatus.Aborted) {
        return StepRunTaskStatus.Aborted;
    }
    throw new Error(`Unknown step run status: ${value}.`);
};

/*
 * Maps a `WorkflowsStepRunInfo` (R257). The server maps its task statuses itself, so a status
 * outside the union means the two sides disagree: this throws instead of showing a wrong status.
 */
export const mapStepRunInfo = (dto: ReviewStepRunInfoDto): ReviewStepRunInfo => {
    return {
        taskId: dto.taskId,
        status: toStatus(dto.status),
        startedOn: dto.startedOn ?? null,
        finishedOn: dto.finishedOn ?? null,
        iterations: dto.iterations,
        outcome: dto.outcome ?? null,
        reason: dto.reason ?? null
    };
};
```

Create `packages/app-workflows/src/review/gateway/mapBlockingReview.ts`:

```ts
import type { BlockingReviewDto } from "./dto.js";
import type { BlockingReview } from "~/review/domain/types.js";

// Maps a `WorkflowsBlockingReview` (R265): the review in progress that blocks a bulk trash.
export const mapBlockingReview = (dto: BlockingReviewDto): BlockingReview => {
    return {
        reviewId: dto.reviewId,
        model: dto.model,
        targetId: dto.targetId,
        targetRevisionId: dto.targetRevisionId,
        title: dto.title,
        stepPosition: dto.stepPosition,
        stepCount: dto.stepCount,
        stepName: dto.stepName
    };
};
```

Modify `packages/app-workflows/src/review/domain/ReviewErrorCode.ts`:

```ts
// before
    ActiveReviewOnTrash: "Workflows/Review/ActiveReviewOnTrash",
    NotAuthorized: "Workflows/NotAuthorized",

// after
    ActiveReviewOnTrash: "Workflows/Review/ActiveReviewOnTrash",
    TargetSync: "Workflows/Review/TargetSync",
    StepRunNotFound: "Workflows/Review/StepRunNotFound",
    NotAuthorized: "Workflows/NotAuthorized",
```

Modify `packages/app-workflows/src/review/domain/types.ts`. Add the import at the top (after the `StepStateValue` import):

```ts
import type { StepRunTaskStatus } from "./StepRunTaskStatus.js";
```

and add after `BlockingReview`'s interface (before `ActiveReviewOnTrashData`):

```ts
/*
 * What workflows tells about one step's background task (R257): only these fields, never the task
 * input, output or logs (R146).
 */
export interface ReviewStepRunInfo {
    taskId: string;
    status: StepRunTaskStatus;
    startedOn: string | null;
    finishedOn: string | null;
    // The automation's own run count, computed by the server.
    iterations: number;
    outcome: string | null;
    reason: string | null;
}
```

Modify `packages/app-workflows/src/review/gateway/dto.ts`: append after `ReviewListEnvelope`:

```ts

export interface ReviewStepRunInfoDto {
    taskId: string;
    // The wire type is `String`; `mapStepRunInfo` narrows it to `StepRunTaskStatus`.
    status: string;
    startedOn: string | null;
    finishedOn: string | null;
    iterations: number;
    outcome: string | null;
    reason: string | null;
}

export interface BlockingReviewDto {
    reviewId: string;
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    stepPosition: number;
    stepCount: number;
    stepName: string;
}
```

Modify `packages/app-workflows/src/review/gateway/reviewFields.ts`: insert before the final `REVIEW_SYSTEM_WORKFLOW_SELECTION` comment line:

```ts
// The `WorkflowsStepRunInfo` selection (R257): the only task fields workflows exposes (R146).
export const STEP_RUN_INFO_FIELDS = /* GraphQL */ `
    taskId
    status
    startedOn
    finishedOn
    iterations
    outcome
    reason
`;

// The `WorkflowsBlockingReview` selection of the bulk pre-check (R265).
export const BLOCKING_REVIEW_FIELDS = /* GraphQL */ `
    reviewId
    model
    targetId
    targetRevisionId
    title
    stepPosition
    stepCount
    stepName
`;

```

Modify `packages/app-workflows/src/review/gateway/IReviewGateway.ts`.

Hunk 1, imports (add after the existing `import type { ReviewEnvelope } from "./dto.js";` group; one import per line):

```ts
import type { BlockingReviewDto } from "./dto.js";
import type { ReviewStepRunInfoDto } from "./dto.js";
```

Hunk 2, after `export interface CancelForDeleteParams { ... }`:

```ts

export interface GetStepRunParams {
    reviewId: string;
    stepId: string;
    taskId: string;
}

export interface ListBlockingReviewsParams {
    namespace: string;
    targetIds: string[];
}
```

Hunk 3, the interface:

```ts
// before
    cancelReview(params: CancelReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    cancelForDelete(params: CancelForDeleteParams): Promise<ReviewEnvelope<ReviewDto[]>>;
}

// after
    cancelReview(params: CancelReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    restartStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>>;
    cancelForDelete(params: CancelForDeleteParams): Promise<ReviewEnvelope<ReviewDto[]>>;
    getStepRun(params: GetStepRunParams): Promise<ReviewEnvelope<ReviewStepRunInfoDto | null>>;
    listBlockingReviews(
        params: ListBlockingReviewsParams
    ): Promise<ReviewEnvelope<BlockingReviewDto[]>>;
}
```

Modify `packages/app-workflows/src/review/useCases/IReviewActionUseCases.ts`: add `    restartStep(params: ReviewStepRef): Promise<Review>;` after `cancelReview(...)`.

Modify `packages/app-workflows/src/review/useCases/IReviewReadUseCases.ts`: add the imports `import type { GetStepRunParams } from "~/review/gateway/IReviewGateway.js";` and `import type { ReviewStepRunInfo } from "~/review/domain/types.js";` and the method after `listReviewStepCandidates`:

```ts
    // `null` when the task record is gone (R257); an error envelope throws.
    getStepRun(params: GetStepRunParams): Promise<ReviewStepRunInfo | null>;
```

Replace `packages/app-workflows/src/review/useCases/IReviewCancelForDeleteUseCases.ts` with:

```ts
import type { CancelForDeleteParams } from "~/review/gateway/IReviewGateway.js";
import type { ListBlockingReviewsParams } from "~/review/gateway/IReviewGateway.js";
import type { BlockingReview } from "~/review/domain/types.js";
import type { Review } from "~/review/domain/types.js";

export interface IReviewCancelForDeleteUseCases {
    cancelForDelete(params: CancelForDeleteParams): Promise<Review[]>;
    // The reviews in progress of the given targets, for the bulk pre-check (R265).
    listBlockingReviews(params: ListBlockingReviewsParams): Promise<BlockingReview[]>;
}
```

Modify `packages/app-workflows/src/review/useCases/ReviewUseCases.ts`.

Hunk 1, imports (one per line, next to their neighbours): `GetStepRunParams` and `ListBlockingReviewsParams` from `~/review/gateway/IReviewGateway.js`; `import type { BlockingReview } from "~/review/domain/types.js";` and `import type { ReviewStepRunInfo } from "~/review/domain/types.js";`; `import { mapBlockingReview } from "~/review/gateway/mapBlockingReview.js";` and `import { mapStepRunInfo } from "~/review/gateway/mapStepRunInfo.js";`.

Hunk 2, add after `listReviewStepCandidates(...)` (before `listReviews`):

```ts
    public async getStepRun(params: GetStepRunParams): Promise<ReviewStepRunInfo | null> {
        const envelope = await this.gateway.getStepRun(params);
        if (envelope.error) {
            throw new GraphQLOperationError({
                message: envelope.error.message ?? FALLBACK_MESSAGE,
                code: envelope.error.code,
                data: envelope.error.data
            });
        }
        if (!envelope.data) {
            return null;
        }
        return mapStepRunInfo(envelope.data);
    }

```

Hunk 3, add after `cancelReview(...)` (before `cancelForDelete`):

```ts
    public async restartStep(params: ReviewStepRef): Promise<Review> {
        const envelope = await this.gateway.restartStep(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

```

Hunk 4, add at the end of the class, after `cancelForDelete`:

```ts

    public async listBlockingReviews(params: ListBlockingReviewsParams): Promise<BlockingReview[]> {
        const envelope = await this.gateway.listBlockingReviews(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return envelope.data.map(mapBlockingReview);
    }
```

Modify `packages/app-workflows/src/review/testing/fakeReviewUseCases.ts`:

```ts
// interface FakeReviewUseCases: add after `cancelForDelete`
    restartStep: Mock<IReviewUseCases["restartStep"]>;
    getStepRun: Mock<IReviewUseCases["getStepRun"]>;
    listBlockingReviews: Mock<IReviewUseCases["listBlockingReviews"]>;

// the factory: add after `cancelForDelete: vi.fn().mockResolvedValue([])` (add the comma)
        cancelForDelete: vi.fn().mockResolvedValue([]),
        restartStep: vi.fn().mockResolvedValue(review),
        getStepRun: vi.fn().mockResolvedValue(null),
        listBlockingReviews: vi.fn().mockResolvedValue([])
```

and change the doc comment `(all fourteen methods of `IReviewUseCases`)` to `(all seventeen methods of `IReviewUseCases`)` and `nothing is cancelled for delete` to `nothing is cancelled for delete, no task is found and nothing blocks`.

Modify `packages/app-workflows/src/review/testing/reviewFixtures.ts`.

Hunk 1, imports: add `import type { BlockingReviewDto } from "~/review/gateway/dto.js";`, `import type { ReviewStepRunInfoDto } from "~/review/gateway/dto.js";`, `import type { BlockingReview } from "~/review/domain/types.js";` and `import type { ReviewStepRunInfo } from "~/review/domain/types.js";`.

Hunk 2, append at the end of the file:

```ts

export const createStepRunInfoDto = (
    overrides: Partial<ReviewStepRunInfoDto> = {}
): ReviewStepRunInfoDto => {
    return {
        taskId: "task-1",
        status: "done",
        startedOn: T1,
        finishedOn: T2,
        iterations: 1,
        outcome: "approved",
        reason: null,
        ...overrides
    };
};

export const createBlockingReviewDto = (
    overrides: Partial<BlockingReviewDto> = {}
): BlockingReviewDto => {
    return {
        reviewId: "review-1",
        model: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Launch article",
        stepPosition: 1,
        stepCount: 2,
        stepName: "Editorial check",
        ...overrides
    };
};

// The domain builders: pure data, as the DTO builders above.
export const createStepRunInfo = (overrides: Partial<ReviewStepRunInfo> = {}): ReviewStepRunInfo => {
    return {
        taskId: "task-1",
        status: "done",
        startedOn: T1,
        finishedOn: T2,
        iterations: 1,
        outcome: "approved",
        reason: null,
        ...overrides
    };
};

export const createBlockingReview = (overrides: Partial<BlockingReview> = {}): BlockingReview => {
    return {
        reviewId: "review-1",
        model: "cms.article",
        targetId: "entry-1",
        targetRevisionId: "entry-1#0001",
        title: "Launch article",
        stepPosition: 1,
        stepCount: 2,
        stepName: "Editorial check",
        ...overrides
    };
};
```

Hunk H, the three `app-workflows` test doubles of `IReviewCancelForDeleteUseCases` (the interface gained a method). Apply with one command per pattern from the repository root, then read the diff:

```bash
perl -0pi -e 's/^(\s+)(cancelForDelete: vi\.fn\(async \(_params: CancelForDeleteParams\): Promise<Review\[\]> => \[\]\))$/$1$2,\n$1listBlockingReviews: vi.fn(async () => [])/mg' packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts
perl -0pi -e 's/\{ cancelForDelete: vi\.fn\(async \(\) => \[\]\) \}/{ cancelForDelete: vi.fn(async () => []), listBlockingReviews: vi.fn(async () => []) }/g' packages/app-workflows/src/review/trash/ActiveReviewTrashFeature.test.tsx
git diff --stat packages/app-workflows/src/review/trash
```

Expected: `ActiveReviewGuard.test.ts` gains one line (`createUseCases`), `ActiveReviewTrashFeature.test.tsx` changes two lines (the `useCases:` option at the first `guard.run` call and `const useCases` further down). `yarn format:fix` in Step 6 wraps the long lines.

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
yarn test packages/app-workflows/src/review/domain/ReviewErrorCode.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/review/gateway/mapStepRunInfo.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/review/gateway/mapBlockingReview.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/__tests__/reviewFields.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts 2>&1 | tail -30
```

Expected: all pass. The generic `it.each(operationCases)` tests now also run for `getStepRun`, `listBlockingReviews` and (through `actionCases`) `restartStep`: error envelope to `GraphQLOperationError`, the generic fallback message, the transport pass-through.

- [ ] **Step 5: Run the existing tests that cover the changed code, and type-check**

```bash
yarn test packages/app-workflows/src/review/gateway 2>&1 | tail -40
yarn test packages/app-workflows/src/review/useCases 2>&1 | tail -40
yarn test packages/app-workflows/src/review/trash 2>&1 | tail -40
yarn test packages/app-workflows/src/review/domain 2>&1 | tail -40
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: no failures, no type errors. The build type-checks every co-located test (`FakeGateway` in `ReviewUseCases.test.ts` lists all 17 gateway methods, the trash test doubles satisfy `IReviewCancelForDeleteUseCases`). The CMS and WB packages are not built here: their gateway classes lack the three methods until Task 9.

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
git commit -m "feat(app-workflows): add restart, step run and blocking review reads to the client core" \
  -m "Gateway, DTOs, fragments, mappers, use cases and fakes for restartStep, getStepRun and listBlockingReviews. The CMS and WB gateways follow in the next commit." \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" \
  -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step fails and you fix something, rerun the chain from the start. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`. `<CURRENT_SESSION_URL>` is replaced by the executor with the URL of the session that runs the commit.

**Contract notes:**
- `StepRunTaskStatus` is a value object and a union under one name (the contract names the union; the 8a `StepState` convention would call it `...Value`). Both are exported from `domain/StepRunTaskStatus.ts`.
- `mapStepRunInfo` throws for an unknown status; the contract does not say what to do. The server maps the five statuses itself, so this is an invariant check, not user-facing logic.
- `listBlockingReviews` lives on `IReviewCancelForDeleteUseCases` as the contract says, which is a breaking change for 12 test doubles of that interface (3 here, 9 in Task 9). The alternative (`IReviewReadUseCases`) would have avoided it, but the shared guard and Task 19's decorator already receive this interface and `confirmBlocking` takes it too.
- Task 15 shows the generic error text (not a specific one) when this mapper throws; the throw is kept because no safe status can be invented.
- `ReviewStepRunInfoDto.status` is `string` (the SDL type is `String!`, R257), while the domain type is the union.
