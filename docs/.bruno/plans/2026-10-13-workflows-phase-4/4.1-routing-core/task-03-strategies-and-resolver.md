### Task 3: Round robin, least loaded, `RoutingStepAssignmentResolver`, fall-through

Spec 6, D20, D63, D137, R110, R115, R116, R130, A29, A46. Strategies decide who is asked first, the routing resolver replaces the pool-only one, and any failure sends the step to the pool:

- `RoutingStrategyService.order({ strategy, candidates, model, workflowId, stepId })` (DI service) returns the candidates in the order to ask them. The evaluator (Task 2) checks read access lazily in that order.
  - `roundRobin`: find the latest record with `kind: "outcome"` and a non-null `userId` for `workflowId` + `stepId`; any source with a user counts, including `poolStart`, `takeOver` and `reassign`. Start with the next candidate by user id after that user, wrapping around. The last assignee may no longer be a candidate; their id still marks the position. With no such record, or no stored workflow (`workflowId: null`), start with the first candidate. Pure `orderRoundRobin`.
  - `leastLoaded` (D137): a candidate's load is the number of active reviews with `currentStepState: "inReview"` they own, in namespaces of the same app as the review. The app is the namespace prefix before the first `.` (pure `getNamespaceApp`). The fewest wins. Ties go to the least recently assigned: the latest outcome record with that user, among the workflows whose models are all of the same app. A candidate never assigned counts as least recent; candidates still tied go in user id order. The record and workflow reads happen only when loads tie. Pure `orderLeastLoaded`.
- New repository reads: `ReviewRepository.listInReviewByOwners(ownerIds)` pages index rows with `currentOwnerId_in`, `currentStepState: "inReview"` and `isActive: true`, with no model filter (the app filter runs in code). The rows are not confirmed from primary storage: a stale row only shifts a load count (A46). An empty list is answered without a query. `AssignmentRepository.list` gains the `kind` and `workflowId_in` filters; an empty `workflowId_in` is answered without a query.
- `RoutingStepAssignmentResolver` replaces `PoolStepAssignmentResolver` (deleted; `ReviewLifecycleFeature` registers the new one). It parses the step config; an unparsable config leaves an empty pool, as before. It then calls `RoutingEvaluatorService.evaluate` with the review's model, workflow, requester, folder (`targetContext.folder`, current because moves are refused during a review; ancestors read at reach, R130), pick, target read scope and the reach `now`, and maps the evaluation: the owner becomes a `user` Actor with `identityType: "admin"`, and `ruleId` and `reason` go onto the assignment when set. R116: a failed result or any throw (users, settings, folder chain, read check, log, review or workflow reads) gives the pool of the step's teams with `{ source: "pool", reason: "Routing failed; the step went to the pool." }` and one matching outcome record, and the error is logged with that message. The step still reaches.
- App packages: no expectation changes. Their test workflows use `strategy: "none"`, no rules and no picks (`packages/api-headless-cms-workflows/__tests__/__workflows/workflow.ts:24`, `packages/api-website-builder-workflows/__tests__/__helpers/engine.ts:36`). The routing resolver therefore returns the pool without any dependency call, exactly as before. The record changes those tests saw were handled in Task 1 (`seeds.ts`, `assignments.ts`, `targetReviewAndAssignments.test.ts`, `cmsWorkflowsSchema.test.ts`). Step 8 runs their request and transition tests to confirm.
- In `packages/api-workflows`, the "Review lifecycle defaults" test that pinned the pool-only resolver now pins the routing resolver: nobody is stored as an admin user, so the pick is skipped as "Not a member of the step's teams.". The `RequestReview.test.ts` pick test gets a new name only. The `ListReviews.test.ts` in-memory repository gains `listInReviewByOwners`.

**Files:**
- Create: `packages/api-workflows/src/domain/routing/getNamespaceApp.ts`
- Create: `packages/api-workflows/src/domain/routing/orderRoundRobin.ts`
- Create: `packages/api-workflows/src/domain/routing/orderLeastLoaded.ts`
- Create: `packages/api-workflows/src/domain/routing/toStepAssignmentResolution.ts`
- Create: `packages/api-workflows/src/domain/routing/createRoutingFailedResolution.ts`
- Modify: `packages/api-workflows/src/domain/assignment/abstractions/AssignmentRepository.ts`
- Modify: `packages/api-workflows/src/features/assignment/shared/AssignmentRepository.ts`
- Modify: `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`
- Modify: `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`
- Create: `packages/api-workflows/src/features/routing/RoutingStrategyService/abstractions.ts`
- Create: `packages/api-workflows/src/features/routing/RoutingStrategyService/RoutingStrategyService.ts`
- Create: `packages/api-workflows/src/features/routing/RoutingStrategyService/feature.ts`
- Create: `packages/api-workflows/src/features/routing/RoutingStrategyService/index.ts`
- Modify: `packages/api-workflows/src/features/routing/RoutingEvaluatorService/RoutingEvaluatorService.ts`
- Create: `packages/api-workflows/src/features/review/StepAssignmentResolver/RoutingStepAssignmentResolver.ts`
- Delete: `packages/api-workflows/src/features/review/StepAssignmentResolver/PoolStepAssignmentResolver.ts`
- Modify: `packages/api-workflows/src/features/review/StepAssignmentResolver/abstractions.ts`
- Modify: `packages/api-workflows/src/features/review/ReviewLifecycleFeature.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/routingSeeds.ts`
- Modify: `packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts`
- Modify: `packages/api-workflows/__tests__/review/ListReviews.test.ts`
- Modify: `packages/api-workflows/__tests__/review/ReviewSaver.test.ts`
- Modify: `packages/api-workflows/__tests__/review/RequestReview.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`
- Test: `packages/api-workflows/__tests__/routing/strategyOrder.test.ts`
- Test: `packages/api-workflows/__tests__/review/ListInReviewByOwners.test.ts`
- Test: `packages/api-workflows/__tests__/routing/RoutingStrategyService.test.ts`
- Test: `packages/api-workflows/__tests__/routing/RoutingStepAssignmentResolver.test.ts`

**Interfaces:**
- Consumes: `RoutingEvaluatorService` and the routing types (Task 2), `ROUTING_FAILED_REASON` (Task 2), `StepAssignmentResolution` with `records` and `StepAssignmentResolverParams.now` (Task 1), `AssignmentRepository.list`, `ReviewRepository`, `WorkflowRepository.list({ limit?, after? })` (`Workflow.models`), `ListLatestEntriesUseCase`, `Logger`, `parseReviewStepConfig`, the routing test helpers (Task 2), `captureLoggedErrors` / `loggedErrors` (Task 1).
- Produces (4.2 uses these names exactly):
  - `getNamespaceApp(model: string): string` (`domain/routing/getNamespaceApp.js`).
  - `orderRoundRobin(candidates: RoutingUser[], lastAssigneeId: string | null): RoutingUser[]`, `orderLeastLoaded(candidates: RoutingUser[], loads: ReadonlyMap<string, number>, lastAssignedOn: ReadonlyMap<string, string>): RoutingUser[]`.
  - `toStepAssignmentResolution(evaluation: RoutingEvaluation): StepAssignmentResolution`, `createRoutingFailedResolution(teamIds: string[]): StepAssignmentResolution`.
  - `AssignmentRepositoryListWhere.kind?: AssignmentRecordKind`, `AssignmentRepositoryListWhere.workflowId_in?: string[]`.
  - `ReviewRepository.Interface.listInReviewByOwners(ownerIds: string[]): Promise<Result<ReviewData[], ReviewPersistenceError>>`.
  - `RoutingStrategyService` (`features/routing/RoutingStrategyService/index.js`): `order(params: RoutingStrategyOrderParams): Promise<Result<RoutingUser[], RoutingDependencyError>>`, `RoutingStrategyOrderParams { strategy: RoutingStrategyName; candidates: RoutingUser[]; model: string; workflowId: string | null; stepId: string }`; namespace `Interface`, `OrderParams`, `Return`.
  - `RoutingStepAssignmentResolver` (`features/review/StepAssignmentResolver/RoutingStepAssignmentResolver.js`), the registered `StepAssignmentResolver`.
  - Test helpers: `inReviewData(id, ownerId, model): ReviewData`, `assignmentRecord(overrides): AssignmentRecordValues` (`__tests__/__helpers/routingSeeds.ts`).

- [ ] **Step 1: Write the helpers and the failing tests**

Create `packages/api-workflows/__tests__/__helpers/routingSeeds.ts`:

```ts
import type { ReviewData } from "~/domain/review/types.js";
import type { AssignmentRecordValues } from "~/domain/assignment/types.js";
import { createStartedReview, reviewer, toSaveData } from "./fixtures.js";

/**
 * An active review of `model` whose first step is in review, owned by `ownerId`. Store it with
 * `ReviewRepository.save` to give that user load (R115).
 */
export const inReviewData = (id: string, ownerId: string, model: string): ReviewData => {
    const data = toSaveData(createStartedReview({ id, targetRevisionId: `${id}#0001` }));
    return {
        ...data,
        model,
        currentOwnerId: ownerId,
        steps: data.steps.map((step, index) => {
            return index === 0 ? { ...step, owner: { ...reviewer, id: ownerId } } : step;
        })
    };
};

/** A pool outcome of "workflow-1" / "legal" at 10:00, with the given fields replaced. */
export const assignmentRecord = (
    overrides: Partial<AssignmentRecordValues> = {}
): AssignmentRecordValues => {
    return {
        reviewId: "review-1",
        workflowId: "workflow-1",
        stepId: "legal",
        userId: null,
        assignedOn: "2026-10-09T10:00:00.000Z",
        source: "pool",
        ruleId: null,
        by: null,
        reason: null,
        kind: "outcome",
        ...overrides
    };
};
```

Create `packages/api-workflows/__tests__/routing/strategyOrder.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getNamespaceApp } from "~/domain/routing/getNamespaceApp.js";
import { orderRoundRobin } from "~/domain/routing/orderRoundRobin.js";
import { orderLeastLoaded } from "~/domain/routing/orderLeastLoaded.js";

const ANNA = { id: "user-anna", displayName: "Anna" };
const BOB = { id: "user-bob", displayName: "Bob" };
const CARA = { id: "user-cara", displayName: "Cara" };
const CANDIDATES = [ANNA, BOB, CARA];

const ids = (users: typeof CANDIDATES): string[] => users.map(user => user.id);

describe("getNamespaceApp (D137)", () => {
    it("takes the prefix before the first dot", () => {
        expect(getNamespaceApp("cms.article")).toBe("cms");
        expect(getNamespaceApp("cms.blog.post")).toBe("cms");
        expect(getNamespaceApp("wb.page")).toBe("wb");
        expect(getNamespaceApp("plain")).toBe("plain");
    });
});

describe("orderRoundRobin (R115)", () => {
    it("starts with the first candidate without a last assignee", () => {
        expect(ids(orderRoundRobin(CANDIDATES, null))).toEqual([ANNA.id, BOB.id, CARA.id]);
    });

    it("starts after the last assignee by user id and wraps around", () => {
        expect(ids(orderRoundRobin(CANDIDATES, BOB.id))).toEqual([CARA.id, ANNA.id, BOB.id]);
        expect(ids(orderRoundRobin(CANDIDATES, CARA.id))).toEqual([ANNA.id, BOB.id, CARA.id]);
    });

    it("keeps the position of a last assignee who is no longer a candidate", () => {
        expect(ids(orderRoundRobin(CANDIDATES, "user-bea"))).toEqual([BOB.id, CARA.id, ANNA.id]);
        expect(ids(orderRoundRobin(CANDIDATES, "user-zed"))).toEqual([ANNA.id, BOB.id, CARA.id]);
    });

    it("does not change its input", () => {
        const input = [...CANDIDATES];

        orderRoundRobin(input, ANNA.id);

        expect(input).toEqual(CANDIDATES);
    });
});

describe("orderLeastLoaded (R115, D137)", () => {
    it("puts the fewest reviews first", () => {
        const loads = new Map([
            [ANNA.id, 2],
            [BOB.id, 1]
        ]);

        expect(ids(orderLeastLoaded(CANDIDATES, loads, new Map()))).toEqual([
            CARA.id,
            BOB.id,
            ANNA.id
        ]);
    });

    it("breaks ties by the least recent assignment, never assigned first, then by id", () => {
        const lastAssignedOn = new Map([
            [ANNA.id, "2026-10-09T11:00:00.000Z"],
            [BOB.id, "2026-10-09T10:00:00.000Z"]
        ]);

        expect(ids(orderLeastLoaded(CANDIDATES, new Map(), lastAssignedOn))).toEqual([
            CARA.id,
            BOB.id,
            ANNA.id
        ]);
        expect(ids(orderLeastLoaded(CANDIDATES, new Map(), new Map()))).toEqual([
            ANNA.id,
            BOB.id,
            CARA.id
        ]);
    });
});
```

Create `packages/api-workflows/__tests__/review/ListInReviewByOwners.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createRequestedReview, expectOk, toSaveData } from "~tests/__helpers/fixtures.js";
import { inReviewData } from "~tests/__helpers/routingSeeds.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";

describe("ReviewRepository.listInReviewByOwners (R115)", () => {
    it("lists the active in-review reviews of the owners, in every namespace", async () => {
        const { context } = await createContextHandler();
        const reviews = context.container.resolve(ReviewRepository);
        expectOk(await reviews.save(inReviewData("review-a", "user-anna", "cms.article")));
        expectOk(await reviews.save(inReviewData("review-b", "user-bob", "wb.page")));
        expectOk(await reviews.save(inReviewData("review-d", "user-dan", "cms.article")));
        expectOk(
            await reviews.save({
                ...inReviewData("review-inactive", "user-anna", "cms.article"),
                isActive: false,
                state: "cancelled"
            })
        );
        expectOk(
            await reviews.save(
                toSaveData(
                    createRequestedReview({ id: "review-pool", targetRevisionId: "article-9#0001" })
                )
            )
        );

        const listed = expectOk(await reviews.listInReviewByOwners(["user-anna", "user-bob"]));

        expect(listed.map(review => review.id).sort()).toEqual(["review-a", "review-b"]);
        expect(listed.map(review => review.currentOwnerId).sort()).toEqual([
            "user-anna",
            "user-bob"
        ]);
    });

    it("answers an empty owner list with no reviews", async () => {
        const { context } = await createContextHandler();
        const reviews = context.container.resolve(ReviewRepository);
        expectOk(await reviews.save(inReviewData("review-a", "user-anna", "cms.article")));

        expect(expectOk(await reviews.listInReviewByOwners([]))).toEqual([]);
    });
});
```

Create `packages/api-workflows/__tests__/routing/RoutingStrategyService.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ARTICLE_MODEL, createWorkflowValues, expectOk } from "~tests/__helpers/fixtures.js";
import { assignmentRecord, inReviewData } from "~tests/__helpers/routingSeeds.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import type { RoutingStrategyName, RoutingUser } from "~/domain/routing/types.js";
import { RoutingStrategyService } from "~/features/routing/RoutingStrategyService/index.js";

const ANNA = { id: "user-anna", displayName: "Anna" };
const BOB = { id: "user-bob", displayName: "Bob" };
const CARA = { id: "user-cara", displayName: "Cara" };
const CANDIDATES: RoutingUser[] = [ANNA, BOB, CARA];

const createStrategyContext = async () => {
    const { context } = await createContextHandler();
    const strategies = context.container.resolve(RoutingStrategyService);
    const order = async (
        strategy: RoutingStrategyName,
        model = ARTICLE_MODEL,
        workflowId: string | null = "workflow-1"
    ): Promise<string[]> => {
        const ordered = await strategies.order({
            strategy,
            candidates: CANDIDATES,
            model,
            workflowId,
            stepId: "legal"
        });
        return expectOk(ordered).map(user => user.id);
    };
    return {
        order,
        assignments: context.container.resolve(AssignmentRepository),
        reviews: context.container.resolve(ReviewRepository),
        workflows: context.container.resolve(WorkflowRepository)
    };
};

describe("RoutingStrategyService: round robin (R115)", () => {
    it("starts with the first candidate without history or without a stored workflow", async () => {
        const { order } = await createStrategyContext();

        expect(await order("roundRobin")).toEqual([ANNA.id, BOB.id, CARA.id]);
        expect(await order("roundRobin", ARTICLE_MODEL, null)).toEqual([
            ANNA.id,
            BOB.id,
            CARA.id
        ]);
    });

    it("asks the candidate after the latest assignee of the workflow step first", async () => {
        const { order, assignments } = await createStrategyContext();
        const seeds = [
            assignmentRecord({ userId: BOB.id, source: "roundRobin" }),
            // Newer, but not an assignee: a skip and a pool outcome.
            assignmentRecord({
                userId: CARA.id,
                source: "roundRobin",
                kind: "skip",
                reason: "Cannot read this content.",
                assignedOn: "2026-10-09T11:00:00.000Z"
            }),
            assignmentRecord({ assignedOn: "2026-10-09T12:00:00.000Z" }),
            // Newer, but another step and another workflow.
            assignmentRecord({
                userId: ANNA.id,
                stepId: "editorial",
                source: "roundRobin",
                assignedOn: "2026-10-09T13:00:00.000Z"
            }),
            assignmentRecord({
                userId: CARA.id,
                workflowId: "workflow-2",
                source: "roundRobin",
                assignedOn: "2026-10-09T14:00:00.000Z"
            })
        ];
        for (const seed of seeds) {
            expectOk(await assignments.create(seed));
        }

        expect(await order("roundRobin")).toEqual([CARA.id, ANNA.id, BOB.id]);
    });

    it("counts take over outcomes and keeps the position of a former candidate", async () => {
        const { order, assignments } = await createStrategyContext();
        expectOk(await assignments.create(assignmentRecord({ userId: CARA.id, source: "poolStart" })));
        expectOk(
            await assignments.create(
                assignmentRecord({
                    userId: "user-bea",
                    source: "takeOver",
                    by: { type: "user", id: "user-bea", displayName: "Bea" },
                    assignedOn: "2026-10-09T11:00:00.000Z"
                })
            )
        );

        expect(await order("roundRobin")).toEqual([BOB.id, CARA.id, ANNA.id]);
    });

    it("wraps around after the last candidate", async () => {
        const { order, assignments } = await createStrategyContext();
        expectOk(await assignments.create(assignmentRecord({ userId: CARA.id, source: "reassign" })));

        expect(await order("roundRobin")).toEqual([ANNA.id, BOB.id, CARA.id]);
    });
});

describe("RoutingStrategyService: least loaded (R115, D137)", () => {
    it("orders by in-review load counted per app", async () => {
        const { order, reviews } = await createStrategyContext();
        const seeds = [
            inReviewData("review-a1", ANNA.id, "cms.article"),
            inReviewData("review-a2", ANNA.id, "cms.blog"),
            inReviewData("review-b1", BOB.id, "cms.article"),
            inReviewData("review-b2", BOB.id, "wb.page"),
            inReviewData("review-b3", BOB.id, "wb.page"),
            inReviewData("review-b4", BOB.id, "wb.page"),
            // Not load: an inactive review.
            { ...inReviewData("review-c1", CARA.id, "cms.article"), isActive: false }
        ];
        for (const seed of seeds) {
            expectOk(await reviews.save(seed));
        }

        expect(await order("leastLoaded", "cms.article")).toEqual([CARA.id, BOB.id, ANNA.id]);
        // Website Builder: Anna and Cara have none and were never assigned, so id order.
        expect(await order("leastLoaded", "wb.page")).toEqual([ANNA.id, CARA.id, BOB.id]);
    });

    it("breaks ties by the least recent assignment in the same app's workflows", async () => {
        const { order, assignments, workflows } = await createStrategyContext();
        expectOk(await workflows.create(createWorkflowValues({ id: "workflow-1" })));
        expectOk(
            await workflows.create(
                createWorkflowValues({ id: "workflow-blog", name: "Blog", models: ["cms.blog"] })
            )
        );
        expectOk(
            await workflows.create(
                createWorkflowValues({ id: "workflow-wb", name: "Pages", models: ["wb.page"] })
            )
        );
        const seeds = [
            assignmentRecord({
                userId: ANNA.id,
                source: "leastLoaded",
                assignedOn: "2026-10-09T08:00:00.000Z"
            }),
            assignmentRecord({
                userId: ANNA.id,
                source: "leastLoaded",
                assignedOn: "2026-10-09T11:00:00.000Z"
            }),
            assignmentRecord({
                userId: BOB.id,
                workflowId: "workflow-blog",
                source: "picked",
                assignedOn: "2026-10-09T10:00:00.000Z"
            }),
            // Ignored: another app's workflow, and a skip.
            assignmentRecord({
                userId: CARA.id,
                workflowId: "workflow-wb",
                source: "picked",
                assignedOn: "2026-10-09T12:00:00.000Z"
            }),
            assignmentRecord({
                userId: CARA.id,
                source: "leastLoaded",
                kind: "skip",
                reason: "Cannot read this content.",
                assignedOn: "2026-10-09T13:00:00.000Z"
            })
        ];
        for (const seed of seeds) {
            expectOk(await assignments.create(seed));
        }

        expect(await order("leastLoaded", "cms.article")).toEqual([CARA.id, BOB.id, ANNA.id]);
    });
});
```

Create `packages/api-workflows/__tests__/routing/RoutingStepAssignmentResolver.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import {
    ARTICLE_MODEL,
    createReviewStep,
    createWorkflow,
    createWorkflowValues,
    editor,
    expectOk,
    NOW,
    poolOutcomeRecord,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import {
    createRoutingContext,
    LEGAL_TEAM_ID,
    resetRoutingFakes
} from "~tests/__helpers/routingContext.js";
import { readableUsers, throwingReadChecks } from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import { folderChainFaults } from "~tests/__helpers/FakeReviewTargetFolderChain.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { FakeReviewTargetLoader } from "~tests/__helpers/FakeReviewTargetLoader.js";
import { createRequestInput } from "~tests/__helpers/reviewContext.js";
import { Review } from "~/domain/review/Review.js";
import type { ReviewData, ReviewPick } from "~/domain/review/types.js";
import type {
    ReviewStepAssignmentConfig,
    Workflow,
    WorkflowStep,
    WorkflowValues
} from "~/domain/workflow/types.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewPersistenceError } from "~/domain/review/errors.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
import { ROUTING_FAILED_REASON } from "~/domain/routing/reasons.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";

interface ReadFaults {
    assignmentList: boolean;
    reviewOwners: boolean;
    workflowList: boolean;
}

const readFaults: ReadFaults = { assignmentList: false, reviewOwners: false, workflowList: false };

class FaultyAssignmentReadsImpl implements AssignmentRepository.Interface {
    public constructor(private decoratee: AssignmentRepository.Interface) {}

    public create(
        values: Parameters<AssignmentRepository.Interface["create"]>[0]
    ): ReturnType<AssignmentRepository.Interface["create"]> {
        return this.decoratee.create(values);
    }

    public async list(
        params: AssignmentRepository.ListParams
    ): ReturnType<AssignmentRepository.Interface["list"]> {
        if (readFaults.assignmentList) {
            return Result.fail(new AssignmentPersistenceError(new Error("Storage is down.")));
        }
        return this.decoratee.list(params);
    }

    public delete(id: string): ReturnType<AssignmentRepository.Interface["delete"]> {
        return this.decoratee.delete(id);
    }
}

class FaultyReviewReadsImpl implements ReviewRepository.Interface {
    public constructor(private decoratee: ReviewRepository.Interface) {}

    public get(id: string): ReturnType<ReviewRepository.Interface["get"]> {
        return this.decoratee.get(id);
    }

    public getActiveByTarget(
        params: ReviewRepository.ActiveByTargetParams
    ): ReturnType<ReviewRepository.Interface["getActiveByTarget"]> {
        return this.decoratee.getActiveByTarget(params);
    }

    public countInProgressByWorkflow(
        workflowId: string
    ): ReturnType<ReviewRepository.Interface["countInProgressByWorkflow"]> {
        return this.decoratee.countInProgressByWorkflow(workflowId);
    }

    public listInProgressByWorkflow(
        workflowId: string
    ): ReturnType<ReviewRepository.Interface["listInProgressByWorkflow"]> {
        return this.decoratee.listInProgressByWorkflow(workflowId);
    }

    public listByTarget(
        params: ReviewRepository.ByTargetParams
    ): ReturnType<ReviewRepository.Interface["listByTarget"]> {
        return this.decoratee.listByTarget(params);
    }

    public list(params: ReviewRepository.ListParams): ReturnType<ReviewRepository.Interface["list"]> {
        return this.decoratee.list(params);
    }

    public async listInReviewByOwners(
        ownerIds: string[]
    ): ReturnType<ReviewRepository.Interface["listInReviewByOwners"]> {
        if (readFaults.reviewOwners) {
            return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
        }
        return this.decoratee.listInReviewByOwners(ownerIds);
    }

    public save(review: ReviewData): ReturnType<ReviewRepository.Interface["save"]> {
        return this.decoratee.save(review);
    }

    public delete(id: string): ReturnType<ReviewRepository.Interface["delete"]> {
        return this.decoratee.delete(id);
    }
}

class FaultyWorkflowReadsImpl implements WorkflowRepository.Interface {
    public constructor(private decoratee: WorkflowRepository.Interface) {}

    public get(id: string): ReturnType<WorkflowRepository.Interface["get"]> {
        return this.decoratee.get(id);
    }

    public async list(
        params: WorkflowRepository.ListParams
    ): ReturnType<WorkflowRepository.Interface["list"]> {
        if (readFaults.workflowList) {
            return Result.fail(new WorkflowPersistenceError(new Error("Storage is down.")));
        }
        return this.decoratee.list(params);
    }

    public create(values: WorkflowValues): ReturnType<WorkflowRepository.Interface["create"]> {
        return this.decoratee.create(values);
    }

    public update(values: WorkflowValues): ReturnType<WorkflowRepository.Interface["update"]> {
        return this.decoratee.update(values);
    }

    public delete(id: string): ReturnType<WorkflowRepository.Interface["delete"]> {
        return this.decoratee.delete(id);
    }
}

const BOB = { id: "user-bob", displayName: "Bob" };
const CARA = { id: "user-cara", displayName: "Cara" };

const adminActor = (user: typeof BOB) => {
    return { type: "user", id: user.id, displayName: user.displayName, identityType: "admin" };
};

const legalStep = (assignment: Partial<ReviewStepAssignmentConfig>): WorkflowStep => {
    return {
        ...createReviewStep({ id: "legal", title: "Legal review" }),
        config: {
            teams: [REVIEW_TEAM_ID],
            assignment: { strategy: "none", allowManualPick: true, rules: [], ...assignment }
        }
    };
};

/** The resolver's params for the first step of a review requested with `workflow`. */
const reachParams = (workflow: Workflow, picks: ReviewPick[] = []) => {
    const review = expectOk(
        Review.request({
            id: "review-1",
            workflow,
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            targetContext,
            picks,
            requester,
            now: NOW
        })
    );
    const step = review.getStepToReach();
    if (!step) {
        throw new Error("The first step must be pending.");
    }
    return { review: review.toData(), step, now: new Date(NOW) };
};

const createResolverContext = async () => {
    const routing = await createRoutingContext({
        setup: container => {
            captureLoggedErrors(container);
            container.register(FakeReviewTargetLoader);
            container.registerDecorator(
                AssignmentRepository.createDecorator({
                    decorator: FaultyAssignmentReadsImpl,
                    dependencies: []
                })
            );
            container.registerDecorator(
                ReviewRepository.createDecorator({
                    decorator: FaultyReviewReadsImpl,
                    dependencies: []
                })
            );
            container.registerDecorator(
                WorkflowRepository.createDecorator({
                    decorator: FaultyWorkflowReadsImpl,
                    dependencies: []
                })
            );
        }
    });
    return {
        ...routing,
        resolver: routing.context.container.resolve(StepAssignmentResolver)
    };
};

describe("RoutingStepAssignmentResolver", () => {
    beforeEach(() => {
        resetRoutingFakes();
        loggedErrors.length = 0;
        readFaults.assignmentList = false;
        readFaults.reviewOwners = false;
        readFaults.workflowList = false;
    });

    it("follows the order pick, rule, strategy, pool (R110)", async () => {
        const { resolver } = await createResolverContext();
        readableUsers.add("user-anna");
        readableUsers.add(BOB.id);
        readableUsers.add(CARA.id);
        const ruleToCara = { id: "rule-cara", conditions: {}, target: { type: "user" as const, id: CARA.id } };
        const all = legalStep({ strategy: "roundRobin", rules: [ruleToCara] });

        const picked = await resolver.resolve(
            reachParams(createWorkflow({ steps: [all] }), [{ stepId: "legal", userId: BOB.id }])
        );
        const ruled = await resolver.resolve(reachParams(createWorkflow({ steps: [all] })));
        const strategy = await resolver.resolve(
            reachParams(createWorkflow({ steps: [legalStep({ strategy: "roundRobin" })] }))
        );
        const pool = await resolver.resolve(
            reachParams(createWorkflow({ steps: [legalStep({})] }))
        );

        expect(picked).toMatchObject({
            owner: adminActor(BOB),
            assignment: { source: "picked" }
        });
        expect(ruled).toMatchObject({
            owner: adminActor(CARA),
            assignment: { source: "rule", ruleId: "rule-cara" }
        });
        expect(strategy).toMatchObject({
            owner: { type: "user", id: "user-anna", displayName: "Anna", identityType: "admin" },
            assignment: { source: "roundRobin" }
        });
        expect(pool).toEqual({
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "pool" },
            records: [poolOutcomeRecord()]
        });
        expect(loggedErrors).toEqual([]);
    });

    it("runs the strategy over a team target and keeps the rule id (R109)", async () => {
        const { resolver } = await createResolverContext();
        readableUsers.add("user-anna");
        readableUsers.add(CARA.id);
        const toLegal = {
            id: "rule-legal",
            conditions: {},
            target: { type: "team" as const, id: LEGAL_TEAM_ID }
        };

        // Save-time validation needs a team target among the step's teams.
        const toLegalStep: WorkflowStep = {
            ...createReviewStep({ id: "legal", title: "Legal review" }),
            config: {
                teams: [REVIEW_TEAM_ID, LEGAL_TEAM_ID],
                assignment: { strategy: "leastLoaded", allowManualPick: true, rules: [toLegal] }
            }
        };

        const resolution = await resolver.resolve(
            reachParams(createWorkflow({ steps: [toLegalStep] }))
        );

        expect(resolution).toEqual({
            owner: adminActor(CARA),
            candidateTeamIds: [LEGAL_TEAM_ID],
            assignment: { source: "leastLoaded", ruleId: "rule-legal" },
            records: [
                {
                    kind: "outcome",
                    userId: CARA.id,
                    source: "leastLoaded",
                    ruleId: "rule-legal",
                    by: null,
                    reason: null
                }
            ]
        });
    });

    it("gives a requested step its owner and writes the records after the save", async () => {
        const { context } = await createResolverContext();
        readableUsers.add(BOB.id);
        expectOk(
            await context.container.resolve(StoreWorkflowUseCase).execute({
                workflow: createWorkflowValues({ steps: [legalStep({ strategy: "roundRobin" })] }),
                actor: editor
            })
        );

        const review = expectOk(
            await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );

        expect(review).toMatchObject({ currentStepState: "inReview", currentOwnerId: BOB.id });
        expect(review.steps[0]).toMatchObject({
            state: "inReview",
            owner: adminActor(BOB),
            assignment: { source: "roundRobin" },
            startedOn: review.steps[0].reachedOn
        });
        const records = expectOk(
            await context.container
                .resolve(AssignmentRepository)
                .list({ where: { reviewId: review.id } })
        ).items;
        expect([...records].sort((a, b) => a.kind.localeCompare(b.kind))).toMatchObject([
            { kind: "outcome", userId: BOB.id, source: "roundRobin" },
            {
                kind: "skip",
                userId: "user-anna",
                source: "roundRobin",
                reason: "Cannot read this content."
            }
        ]);
    });

    const breakUsers = (users: FakeListUsers): void => {
        users.failuresLeft = 1;
    };
    const breakFolderChain = (): void => {
        folderChainFaults.throwNext = true;
    };
    const breakReadCheck = (): void => {
        throwingReadChecks.add("user-anna");
    };
    const breakAssignmentList = (): void => {
        readFaults.assignmentList = true;
    };
    const breakReviewOwners = (): void => {
        readFaults.reviewOwners = true;
    };
    const breakWorkflowList = (): void => {
        readFaults.workflowList = true;
    };

    it.each([
        ["listing users fails", "roundRobin", breakUsers],
        ["reading the folder chain throws", "none", breakFolderChain],
        ["a read check throws", "roundRobin", breakReadCheck],
        ["the round-robin log cannot be read", "roundRobin", breakAssignmentList],
        ["the least-loaded reviews cannot be read", "leastLoaded", breakReviewOwners],
        ["the least-loaded workflows cannot be read", "leastLoaded", breakWorkflowList]
    ] as const)(
        "falls through to the pool when %s (R116)",
        async (_label, strategy, breakIt) => {
            const { resolver, users } = await createResolverContext();
            readableUsers.add(BOB.id);
            breakIt(users);
            const folderRule = {
                id: "rule-folder",
                conditions: {
                    folder: { id: "folder-1", type: "cms:article", includeDescendants: true }
                },
                target: { type: "user" as const, id: BOB.id }
            };
            const step = legalStep({ strategy, rules: strategy === "none" ? [folderRule] : [] });

            const resolution = await resolver.resolve(reachParams(createWorkflow({ steps: [step] })));

            expect(resolution).toEqual({
                owner: null,
                candidateTeamIds: [REVIEW_TEAM_ID],
                assignment: { source: "pool", reason: ROUTING_FAILED_REASON },
                records: [
                    {
                        kind: "outcome",
                        userId: null,
                        source: "pool",
                        ruleId: null,
                        by: null,
                        reason: ROUTING_FAILED_REASON
                    }
                ]
            });
            expect(loggedErrors).toEqual([
                {
                    message: ROUTING_FAILED_REASON,
                    fields: expect.objectContaining({ reviewId: "review-1", stepId: "legal" })
                }
            ]);
        }
    );

    it("falls through to the pool when reading settings fails (R116)", async () => {
        const { resolver, settings } = await createResolverContext();
        settings.failuresLeft = 1;

        const resolution = await resolver.resolve(
            reachParams(createWorkflow({ steps: [legalStep({ strategy: "roundRobin" })] }))
        );

        expect(resolution.assignment).toEqual({ source: "pool", reason: ROUTING_FAILED_REASON });
        expect(loggedErrors.map(item => item.message)).toEqual([ROUTING_FAILED_REASON]);
    });

    it("leaves an empty pool for a step config it cannot parse, without lookups", async () => {
        const { resolver, users } = await createResolverContext();
        const broken = { ...legalStep({}), config: { teams: "not-a-list" } };

        const resolution = await resolver.resolve(reachParams(createWorkflow({ steps: [broken] })));

        expect(resolution).toEqual({
            owner: null,
            candidateTeamIds: [],
            assignment: { source: "pool" },
            records: [poolOutcomeRecord()]
        });
        expect(users.calls).toEqual([]);
    });
});
```

In `packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts`, add at the end of the `describe("AssignmentRepository", ...)` block:

```ts
    it("filters by kind and by a set of workflows (R115)", async () => {
        const repository = await createRepository();
        expectOk(
            await repository.create(
                record({ reviewId: "review-k", userId: reviewer.id, source: "roundRobin" })
            )
        );
        expectOk(
            await repository.create(
                record({
                    reviewId: "review-k",
                    userId: otherReviewer.id,
                    source: "roundRobin",
                    kind: "skip",
                    reason: "Cannot read this content.",
                    assignedOn: "2026-10-09T11:00:00.000Z"
                })
            )
        );
        expectOk(
            await repository.create(
                record({
                    reviewId: "review-k",
                    workflowId: "workflow-2",
                    userId: reviewer.id,
                    source: "picked",
                    assignedOn: "2026-10-09T12:00:00.000Z"
                })
            )
        );

        const outcomes = expectOk(
            await repository.list({ where: { reviewId: "review-k", kind: "outcome" } })
        );
        const inWorkflows = expectOk(
            await repository.list({
                where: { reviewId: "review-k", workflowId_in: ["workflow-2", "workflow-3"] }
            })
        );
        const noWorkflows = expectOk(
            await repository.list({ where: { reviewId: "review-k", workflowId_in: [] } })
        );

        expect(outcomes.items.map(item => item.source)).toEqual(["picked", "roundRobin"]);
        expect(inWorkflows.items.map(item => item.workflowId)).toEqual(["workflow-2"]);
        expect(noWorkflows.items).toEqual([]);
        expect(noWorkflows.meta).toEqual({ cursor: null, hasMoreItems: false, totalCount: 0 });
    });
```

In `packages/api-workflows/__tests__/review/ListReviews.test.ts`, in the in-memory `repository`, replace:

```ts
        listByTarget: async () => Result.ok([]),
```

with:

```ts
        listByTarget: async () => Result.ok([]),
        listInReviewByOwners: async () => Result.ok([]),
```

In `packages/api-workflows/__tests__/review/ReviewSaver.test.ts`, replace the whole test `"ships no target sync, no target loaders and a pool-only resolver"` with:

```ts
    it("ships no target sync, no target loaders and the routing resolver", async () => {
        const { context } = await createContextHandler();
        const review = createRequestedReview({
            picks: [{ stepId: "legal", userId: "user-picked" }]
        }).toData();

        expect(context.container.resolveAll(ReviewTargetSync)).toEqual([]);
        expect(context.container.resolveAll(ReviewTargetLoader)).toEqual([]);

        const resolution = await context.container
            .resolve(StepAssignmentResolver)
            .resolve({ review, step: review.steps[0], now: new Date(NOW) });

        // No admin user is stored: the pick is not a member, the step goes to the pool (spec 6).
        expect(resolution).toEqual({
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "pool" },
            records: [
                {
                    kind: "skip",
                    userId: "user-picked",
                    source: "picked",
                    ruleId: null,
                    by: null,
                    reason: "Not a member of the step's teams."
                },
                poolOutcomeRecord()
            ]
        });
    });
```

In `packages/api-workflows/__tests__/review/RequestReview.test.ts`, rename the test `"stores picks on the review steps; the default resolver leaves the step in the pool"` to `"stores picks on the review steps; a pick outside the step's teams leaves the step in the pool"` (its body stays).

In `packages/api-workflows/__tests__/registration.test.ts`, add the import:

```ts
import { RoutingStrategyService } from "~/features/routing/RoutingStrategyService/index.js";
```

and replace:

```ts
        expect(container.resolveAll(RoutingEvaluatorService)).toHaveLength(1);
```

with:

```ts
        expect(container.resolveAll(RoutingEvaluatorService)).toHaveLength(1);
        expect(container.resolveAll(RoutingStrategyService)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/routing/strategyOrder.test.ts packages/api-workflows/__tests__/routing/RoutingStrategyService.test.ts packages/api-workflows/__tests__/routing/RoutingStepAssignmentResolver.test.ts packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts packages/api-workflows/__tests__/review/ListInReviewByOwners.test.ts packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts packages/api-workflows/__tests__/review/ReviewSaver.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/routing/getNamespaceApp.js`, `~/domain/routing/orderRoundRobin.js`, `~/features/routing/RoutingStrategyService/index.js`; `listInReviewByOwners` is not a function; the kind filter returns the skip too; the defaults test gets the pool resolver's records.

- [ ] **Step 3: Pure strategy order and resolution mapping**

Create `packages/api-workflows/src/domain/routing/getNamespaceApp.ts`:

```ts
/**
 * The app of a namespace (D137): the prefix before the first `.`, e.g. `cms` for `cms.article`
 * and `wb` for `wb.page`. Least loaded counts load per app. Pure.
 */
export const getNamespaceApp = (model: string): string => {
    const index = model.indexOf(".");
    return index === -1 ? model : model.slice(0, index);
};
```

Create `packages/api-workflows/src/domain/routing/orderRoundRobin.ts`:

```ts
import type { RoutingUser } from "./types.js";

/**
 * Round robin (R115): the candidates (sorted by user id) starting with the first id after the
 * last assignee, wrapping around. A last assignee who is no longer a candidate still marks the
 * position; without one the order is unchanged. Pure.
 */
export const orderRoundRobin = (
    candidates: RoutingUser[],
    lastAssigneeId: string | null
): RoutingUser[] => {
    if (!lastAssigneeId) {
        return [...candidates];
    }
    const index = candidates.findIndex(candidate => candidate.id > lastAssigneeId);
    if (index === -1) {
        return [...candidates];
    }
    return [...candidates.slice(index), ...candidates.slice(0, index)];
};
```

Create `packages/api-workflows/src/domain/routing/orderLeastLoaded.ts`:

```ts
import type { RoutingUser } from "./types.js";

/**
 * Least loaded (R115, D137): fewest in-review reviews first; ties go to the least recently
 * assigned (no entry = never assigned = least recent), then to user id order. `loads` and
 * `lastAssignedOn` are keyed by user id; a missing load is 0. Pure.
 */
export const orderLeastLoaded = (
    candidates: RoutingUser[],
    loads: ReadonlyMap<string, number>,
    lastAssignedOn: ReadonlyMap<string, string>
): RoutingUser[] => {
    return [...candidates].sort((a, b) => {
        const load = (loads.get(a.id) ?? 0) - (loads.get(b.id) ?? 0);
        if (load !== 0) {
            return load;
        }
        const aOn = lastAssignedOn.get(a.id);
        const bOn = lastAssignedOn.get(b.id);
        if (aOn !== bOn) {
            if (!aOn) {
                return -1;
            }
            if (!bOn) {
                return 1;
            }
            const time = Date.parse(aOn) - Date.parse(bOn);
            if (time !== 0) {
                return time;
            }
        }
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });
};
```

Create `packages/api-workflows/src/domain/routing/toStepAssignmentResolution.ts`:

```ts
import type { StepAssignmentResolution } from "~/domain/review/types.js";
import type { RoutingEvaluation } from "./types.js";

/**
 * The resolution for `Review.reach` (spec 5.2, 6): the owner as an admin user actor, the
 * assignment with the deciding rule and the pool reason when set, and the records (R117). Pure.
 */
export const toStepAssignmentResolution = (
    evaluation: RoutingEvaluation
): StepAssignmentResolution => {
    return {
        owner: evaluation.owner
            ? {
                  type: "user",
                  id: evaluation.owner.id,
                  displayName: evaluation.owner.displayName,
                  identityType: "admin"
              }
            : null,
        candidateTeamIds: [...evaluation.candidateTeamIds],
        assignment: {
            source: evaluation.source,
            ...(evaluation.ruleId ? { ruleId: evaluation.ruleId } : {}),
            ...(evaluation.reason ? { reason: evaluation.reason } : {})
        },
        records: structuredClone(evaluation.records)
    };
};
```

Create `packages/api-workflows/src/domain/routing/createRoutingFailedResolution.ts`:

```ts
import type { StepAssignmentResolution } from "~/domain/review/types.js";
import { ROUTING_FAILED_REASON } from "./reasons.js";

/**
 * The pool of the step's teams after a routing failure (spec 6, R116): the step still reaches,
 * and the log says why nobody was chosen. Pure.
 */
export const createRoutingFailedResolution = (teamIds: string[]): StepAssignmentResolution => {
    return {
        owner: null,
        candidateTeamIds: [...teamIds],
        assignment: { source: "pool", reason: ROUTING_FAILED_REASON },
        records: [
            {
                kind: "outcome",
                userId: null,
                source: "pool",
                ruleId: null,
                by: null,
                reason: ROUTING_FAILED_REASON
            }
        ]
    };
};
```

- [ ] **Step 4: Repository reads**

In `packages/api-workflows/src/domain/assignment/abstractions/AssignmentRepository.ts`, replace:

```ts
import type { AssignmentRecord, AssignmentRecordValues } from "../types.js";
```

with:

```ts
import type { AssignmentRecord, AssignmentRecordKind, AssignmentRecordValues } from "../types.js";
```

replace:

```ts
 * Filters combine with AND; omitted (`undefined`) filters do not restrict, an empty string is a
 * real filter value. An empty `userId_in` matches nothing. Pool records (`userId` null) are
 * reachable only via the `reviewId`, `workflowId` and `stepId` filters.
 */
export interface AssignmentRepositoryListWhere {
    reviewId?: string;
    workflowId?: string;
```

with:

```ts
 * Filters combine with AND; omitted (`undefined`) filters do not restrict, an empty string is a
 * real filter value. An empty `userId_in` or `workflowId_in` matches nothing. Pool records
 * (`userId` null) are reachable only via the `reviewId`, `workflowId` and `stepId` filters.
 */
export interface AssignmentRepositoryListWhere {
    reviewId?: string;
    workflowId?: string;
    /** Records of any of these workflows (least-loaded tie-break per app, D137). */
    workflowId_in?: string[];
```

and replace:

```ts
    /** Records of any of these users (phase 4: latest record per candidate, D20). */
    userId_in?: string[];
}
```

with:

```ts
    /** Records of any of these users (phase 4: latest record per candidate, D20). */
    userId_in?: string[];
    /**
     * Only outcomes (who got a step) or only skips (R115). Matches the stored `kind`: records
     * stored without one (read as outcomes, R96) are not matched. The model is unreleased, so
     * such records do not exist outside old test data.
     */
    kind?: AssignmentRecordKind;
}
```

In `packages/api-workflows/src/features/assignment/shared/AssignmentRepository.ts`, replace:

```ts
        if (where.userId_in && where.userId_in.length === 0) {
```

with:

```ts
        if (
            (where.userId_in && where.userId_in.length === 0) ||
            (where.workflowId_in && where.workflowId_in.length === 0)
        ) {
```

and replace:

```ts
        if (where.userId_in !== undefined) {
            values.userId_in = [...where.userId_in];
        }
```

with:

```ts
        if (where.userId_in !== undefined) {
            values.userId_in = [...where.userId_in];
        }
        if (where.workflowId_in !== undefined) {
            values.workflowId_in = [...where.workflowId_in];
        }
        if (where.kind !== undefined) {
            values.kind = where.kind;
        }
```

In `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`, replace:

```ts
    /** Every review of a target (active or not), confirmed from primary storage (R18). */
```

with:

```ts
    /**
     * Active reviews whose current step is in review, owned by any of these users, in every
     * namespace (least-loaded load, R115). Index rows, not confirmed from primary storage: a
     * stale row only shifts a load count (A46). An empty list returns no reviews.
     */
    listInReviewByOwners(ownerIds: string[]): Promise<Result<ReviewData[], ReviewPersistenceError>>;
    /** Every review of a target (active or not), confirmed from primary storage (R18). */
```

In `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`, before `async listByTarget(` add:

```ts
    async listInReviewByOwners(
        ownerIds: string[]
    ): Promise<Result<ReviewData[], ReviewPersistenceError>> {
        // An empty `In` list throws on OpenSearch (DDB returns nothing): answer without querying.
        if (ownerIds.length === 0) {
            return Result.ok([]);
        }
        const model = await this.modelProvider.get();
        const reviews: ReviewData[] = [];
        let after: string | null = null;
        do {
            const result: Awaited<ListLatestEntriesUseCase.Return<ReviewEntryValues>> =
                await this.listLatestEntries.execute<ReviewEntryValues>(model, {
                    where: {
                        values: {
                            currentOwnerId_in: [...ownerIds],
                            currentStepState: "inReview",
                            isActive: true
                        }
                    },
                    sort: ["createdOn_ASC"],
                    limit: COUNT_PAGE_SIZE,
                    after
                });
            if (result.isFail()) {
                return Result.fail(new ReviewPersistenceError(result.error));
            }

            for (const entry of result.value.entries) {
                // Index rows, not confirmed (A46); the filter is checked again on the row.
                const review = ReviewEntryMapper.fromEntry(entry);
                if (
                    review.isActive &&
                    review.currentStepState === "inReview" &&
                    review.currentOwnerId !== null &&
                    ownerIds.includes(review.currentOwnerId)
                ) {
                    reviews.push(review);
                }
            }

            const { meta } = result.value;
            after = meta.hasMoreItems ? meta.cursor : null;
        } while (after);

        return Result.ok(reviews);
    }

```

- [ ] **Step 5: `RoutingStrategyService` and the evaluator's strategy order**

Create `packages/api-workflows/src/features/routing/RoutingStrategyService/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { RoutingDependencyError } from "~/domain/routing/errors.js";
import type { RoutingStrategyName, RoutingUser } from "~/domain/routing/types.js";

export interface RoutingStrategyOrderParams {
    strategy: RoutingStrategyName;
    /** Eligible candidates in their stable order, sorted by user id (R111). */
    candidates: RoutingUser[];
    /** The review's namespace; least loaded counts load in the same app only (D137). */
    model: string;
    /** `null` for a workflow not stored yet: round robin has no history. */
    workflowId: string | null;
    stepId: string;
}

export interface IRoutingStrategyService {
    order(
        params: RoutingStrategyOrderParams
    ): Promise<Result<RoutingUser[], RoutingDependencyError>>;
}

/**
 * The order in which a strategy asks the candidates (R115): round robin after the step's last
 * assignee, least loaded by in-review load per app with the least recently assigned first on
 * ties. The evaluator checks read access lazily in this order. Load and history are read from
 * the list index and can lag (A29, A46).
 */
export const RoutingStrategyService =
    createAbstraction<IRoutingStrategyService>("RoutingStrategyService");

export namespace RoutingStrategyService {
    export type Interface = IRoutingStrategyService;
    export type OrderParams = RoutingStrategyOrderParams;
    export type Return = Promise<Result<RoutingUser[], RoutingDependencyError>>;
}
```

Create `packages/api-workflows/src/features/routing/RoutingStrategyService/RoutingStrategyService.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import { getNamespaceApp } from "~/domain/routing/getNamespaceApp.js";
import { orderLeastLoaded } from "~/domain/routing/orderLeastLoaded.js";
import { orderRoundRobin } from "~/domain/routing/orderRoundRobin.js";
import { RoutingStrategyService as Abstraction } from "./abstractions.js";

const WORKFLOW_PAGE_SIZE = 100;

class RoutingStrategyServiceImpl implements Abstraction.Interface {
    public constructor(
        private assignments: AssignmentRepository.Interface,
        private reviews: ReviewRepository.Interface,
        private workflows: WorkflowRepository.Interface
    ) {}

    public async order(params: Abstraction.OrderParams): Abstraction.Return {
        if (params.candidates.length === 0) {
            return Result.ok([]);
        }

        if (params.strategy === "roundRobin") {
            // The step's last assignee: the newest outcome with a user (start, take over and
            // reassign count too). Pool outcomes have no user, skips are not outcomes.
            let lastAssigneeId: string | null = null;
            if (params.workflowId) {
                let after: string | null = null;
                do {
                    const page: Awaited<ReturnType<AssignmentRepository.Interface["list"]>> =
                        await this.assignments.list({
                            where: {
                                workflowId: params.workflowId,
                                stepId: params.stepId,
                                kind: "outcome"
                            },
                            after
                        });
                    if (page.isFail()) {
                        return Result.fail(new RoutingDependencyError(page.error));
                    }
                    lastAssigneeId = page.value.items.find(item => item.userId)?.userId ?? null;
                    const { meta } = page.value;
                    const next = meta.hasMoreItems ? meta.cursor : null;
                    // A repeated cursor would loop forever; treat it as the end.
                    after = !lastAssigneeId && next && next !== after ? next : null;
                } while (after);
            }
            return Result.ok(orderRoundRobin(params.candidates, lastAssigneeId));
        }

        // Least loaded (D137): in-review reviews owned per candidate, in the review's app only.
        const app = getNamespaceApp(params.model);
        const candidateIds = params.candidates.map(candidate => candidate.id);
        const owned = await this.reviews.listInReviewByOwners(candidateIds);
        if (owned.isFail()) {
            return Result.fail(new RoutingDependencyError(owned.error));
        }
        const loads = new Map<string, number>();
        for (const review of owned.value) {
            if (!review.currentOwnerId || getNamespaceApp(review.model) !== app) {
                continue;
            }
            loads.set(review.currentOwnerId, (loads.get(review.currentOwnerId) ?? 0) + 1);
        }

        const lastAssignedOn = new Map<string, string>();
        const candidateLoads = candidateIds.map(id => loads.get(id) ?? 0);
        if (new Set(candidateLoads).size < candidateLoads.length) {
            // Ties: the latest outcome of each candidate in the workflows of the same app.
            const workflowIds: string[] = [];
            let workflowsAfter: string | null = null;
            do {
                const page: Awaited<ReturnType<WorkflowRepository.Interface["list"]>> =
                    await this.workflows.list({ limit: WORKFLOW_PAGE_SIZE, after: workflowsAfter });
                if (page.isFail()) {
                    return Result.fail(new RoutingDependencyError(page.error));
                }
                for (const workflow of page.value.items) {
                    const sameApp =
                        workflow.models.length > 0 &&
                        workflow.models.every(model => getNamespaceApp(model) === app);
                    if (sameApp) {
                        workflowIds.push(workflow.id);
                    }
                }
                const { meta } = page.value;
                const next = meta.hasMoreItems ? meta.cursor : null;
                workflowsAfter = next && next !== workflowsAfter ? next : null;
            } while (workflowsAfter);

            const pending = new Set(candidateIds);
            let after: string | null = null;
            do {
                const page: Awaited<ReturnType<AssignmentRepository.Interface["list"]>> =
                    await this.assignments.list({
                        where: {
                            userId_in: candidateIds,
                            workflowId_in: workflowIds,
                            kind: "outcome"
                        },
                        after
                    });
                if (page.isFail()) {
                    return Result.fail(new RoutingDependencyError(page.error));
                }
                // Newest first: the first record per candidate is their latest assignment.
                for (const record of page.value.items) {
                    if (record.userId && pending.has(record.userId)) {
                        lastAssignedOn.set(record.userId, record.assignedOn);
                        pending.delete(record.userId);
                    }
                }
                const { meta } = page.value;
                const next = meta.hasMoreItems ? meta.cursor : null;
                after = pending.size > 0 && next && next !== after ? next : null;
            } while (after);
        }

        return Result.ok(orderLeastLoaded(params.candidates, loads, lastAssignedOn));
    }
}

export const RoutingStrategyService = Abstraction.createImplementation({
    implementation: RoutingStrategyServiceImpl,
    dependencies: [AssignmentRepository, ReviewRepository, WorkflowRepository]
});
```

Create `packages/api-workflows/src/features/routing/RoutingStrategyService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RoutingStrategyService } from "./RoutingStrategyService.js";

export const RoutingStrategyFeature = createFeature({
    name: "Workflows/RoutingStrategy",
    register(container) {
        container.register(RoutingStrategyService);
    }
});
```

Create `packages/api-workflows/src/features/routing/RoutingStrategyService/index.ts`:

```ts
export { RoutingStrategyService } from "./abstractions.js";
```

In `packages/api-workflows/src/features/routing/RoutingEvaluatorService/RoutingEvaluatorService.ts`, add the import:

```ts
import { RoutingStrategyService } from "~/features/routing/RoutingStrategyService/abstractions.js";
```

replace the constructor's last parameter:

```ts
        private readAccesses: ReviewTargetReadAccess.Interface[],
        private folderChains: ReviewTargetFolderChain.Interface[]
    ) {}
```

with:

```ts
        private readAccesses: ReviewTargetReadAccess.Interface[],
        private folderChains: ReviewTargetFolderChain.Interface[],
        private strategies: RoutingStrategyService.Interface
    ) {}
```

replace:

```ts
        // Read access is checked lazily in strategy order, stopping at the first readable
        // candidate (R111, A47).
        for (const candidate of candidates) {
```

with:

```ts
        // The strategy decides who is asked first (R115).
        const ordered = await this.strategies.order({
            strategy,
            candidates,
            model: params.model,
            workflowId: params.workflowId,
            stepId: params.stepId
        });
        if (ordered.isFail()) {
            return Result.fail(ordered.error);
        }
        // Read access is checked lazily in strategy order, stopping at the first readable
        // candidate (R111, A47).
        for (const candidate of ordered.value) {
```

and replace:

```ts
        [ReviewTargetReadAccess, { multiple: true }],
        [ReviewTargetFolderChain, { multiple: true }]
    ]
});
```

with:

```ts
        [ReviewTargetReadAccess, { multiple: true }],
        [ReviewTargetFolderChain, { multiple: true }],
        RoutingStrategyService
    ]
});
```

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the import:

```ts
import { RoutingStrategyFeature } from "~/features/routing/RoutingStrategyService/feature.js";
```

and replace:

```ts
        RoutingEvaluatorFeature.register(container);
```

with:

```ts
        RoutingEvaluatorFeature.register(container);
        RoutingStrategyFeature.register(container);
```

- [ ] **Step 6: The routing resolver replaces the pool resolver**

Create `packages/api-workflows/src/features/review/StepAssignmentResolver/RoutingStepAssignmentResolver.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import { createRoutingFailedResolution } from "~/domain/routing/createRoutingFailedResolution.js";
import { toStepAssignmentResolution } from "~/domain/routing/toStepAssignmentResolution.js";
import { ROUTING_FAILED_REASON } from "~/domain/routing/reasons.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/abstractions.js";
import { StepAssignmentResolver } from "./abstractions.js";

/**
 * Step reach routing (spec 6, R110): pick, rules, strategy, pool, through
 * `RoutingEvaluatorService`. Never blocks the review (R116): a failed or throwing lookup gives
 * the pool of the step's teams with a fixed reason, and the error is logged.
 */
class RoutingStepAssignmentResolverImpl implements StepAssignmentResolver.Interface {
    public constructor(
        private evaluator: RoutingEvaluatorService.Interface,
        private logger: Logger.Interface
    ) {}

    public async resolve(
        params: StepAssignmentResolver.Params
    ): Promise<StepAssignmentResolver.Resolution> {
        // Save-time validation guarantees a parsable config. An unparsable one (edited storage)
        // leaves an empty pool; phase 5 fails such steps ("fail on invalid settings").
        const config = parseReviewStepConfig(params.step.config);
        if (!config) {
            return {
                owner: null,
                candidateTeamIds: [],
                assignment: { source: "pool" },
                records: [
                    {
                        kind: "outcome",
                        userId: null,
                        source: "pool",
                        ruleId: null,
                        by: null,
                        reason: null
                    }
                ]
            };
        }

        try {
            const evaluated = await this.evaluator.evaluate({
                config,
                model: params.review.model,
                workflowId: params.review.workflowId,
                stepId: params.step.id,
                requesterId: params.review.createdBy.id,
                pickedUserId: params.step.pickedUserId,
                // The target's current folder: moves are refused while a review is in progress
                // (D84, R55). Its ancestors are read now, through the folder port (R130).
                folder: params.review.targetContext.folder,
                read: {
                    type: "target",
                    targetId: params.review.targetId,
                    targetRevisionId: params.review.targetRevisionId
                },
                now: params.now
            });
            if (evaluated.isFail()) {
                this.logger.error(
                    {
                        error: evaluated.error,
                        reviewId: params.review.id,
                        stepId: params.step.id
                    },
                    ROUTING_FAILED_REASON
                );
                return createRoutingFailedResolution(config.teams);
            }
            return toStepAssignmentResolution(evaluated.value);
        } catch (error) {
            this.logger.error(
                { error, reviewId: params.review.id, stepId: params.step.id },
                ROUTING_FAILED_REASON
            );
            return createRoutingFailedResolution(config.teams);
        }
    }
}

export const RoutingStepAssignmentResolver = StepAssignmentResolver.createImplementation({
    implementation: RoutingStepAssignmentResolverImpl,
    dependencies: [RoutingEvaluatorService, Logger]
});
```

Delete `packages/api-workflows/src/features/review/StepAssignmentResolver/PoolStepAssignmentResolver.ts`:

Run: `git rm packages/api-workflows/src/features/review/StepAssignmentResolver/PoolStepAssignmentResolver.ts`

In `packages/api-workflows/src/features/review/StepAssignmentResolver/abstractions.ts`, replace:

```ts
/**
 * Decides who holds a review step when it is reached (spec 5.2, 6). 1a registers a pool-only
 * resolver; phase 4 replaces it with picks, rules and strategies.
 */
```

with:

```ts
/**
 * Decides who holds a review step when it is reached (spec 5.2, 6). The registered
 * implementation is `RoutingStepAssignmentResolver`: pick, rules, strategy, pool; any failure
 * falls through to the pool (R110, R116).
 */
```

Replace the whole `packages/api-workflows/src/features/review/ReviewLifecycleFeature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { RoutingStepAssignmentResolver } from "./StepAssignmentResolver/RoutingStepAssignmentResolver.js";
import { ReviewStepReacher } from "./ReviewStepReacher/ReviewStepReacher.js";
import { ReviewSaver } from "./ReviewSaver/ReviewSaver.js";

/**
 * Defaults for the review lifecycle. The app target adapters register one `ReviewTargetLoader`,
 * `ReviewTargetSync`, `ReviewTargetReadAccess` and `ReviewTargetFolderChain` per namespace
 * (`cms.*` in api-headless-cms-workflows, `wb.page` in api-website-builder-workflows); the last
 * registered match wins and none matching means nothing to load, sync or read (R28, R50). Steps
 * are routed by `RoutingStepAssignmentResolver` (spec 6).
 */
export const ReviewLifecycleFeature = createFeature({
    name: "Workflows/ReviewLifecycle",
    register(container) {
        container.register(RoutingStepAssignmentResolver);
        container.register(ReviewStepReacher);
        container.register(ReviewSaver);
    }
});
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/routing/strategyOrder.test.ts packages/api-workflows/__tests__/routing/RoutingStrategyService.test.ts packages/api-workflows/__tests__/routing/RoutingStepAssignmentResolver.test.ts packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts packages/api-workflows/__tests__/review/ListInReviewByOwners.test.ts packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts packages/api-workflows/__tests__/review/ListReviews.test.ts packages/api-workflows/__tests__/review/ReviewSaver.test.ts packages/api-workflows/__tests__/review/RequestReview.test.ts packages/api-workflows/__tests__/review/ReviewTransitions.test.ts packages/api-workflows/__tests__/review/AssignmentRecordsAfterSave.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same file list with `yarn test:os`.
Expected: PASS.

- [ ] **Step 8: Confirm the app packages**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/wrappers/requestAndGetReview.test.ts packages/api-headless-cms-workflows/__tests__/wrappers/reviewTransitions.test.ts packages/api-headless-cms-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50`, then the same with `yarn test:os`.
Expected: PASS, with no test file changed (app workflows use `strategy: "none"` without rules or picks).

Run: `yarn test packages/api-website-builder-workflows/__tests__/wrappers/requestAndGetReview.test.ts packages/api-website-builder-workflows/__tests__/wrappers/reviewTransitions.test.ts packages/api-website-builder-workflows/__tests__/wrappers/targetReviewAndAssignments.test.ts packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50`, then the same with `yarn test:os`.
Expected: PASS, no test file changed.

If one of these fails because a step now has an owner, the failing workflow helper is not `strategy: "none"`. Update that test's expectation to the owner the routing order gives (R110), and list the file in the commit.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows` and `@webiny/api-website-builder-workflows` with `--no-cache`), then commit:

```
feat(api-workflows): route reached steps through picks, rules, round robin and least loaded, falling through to the pool

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
