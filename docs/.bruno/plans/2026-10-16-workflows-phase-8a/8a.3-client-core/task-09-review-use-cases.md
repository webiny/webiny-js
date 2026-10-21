### Task 9: Shared `ReviewUseCases`

Spec 13.1; R202 (one shared implementation, app-owned gateway and tokens), R204 (envelope error becomes `GraphQLOperationError`, transport `Error`s pass), R211 and A74 (the workflow list is loaded once per use-case instance and cached per page session, `null` is cached, a failure is not), A81 (a thrown `GraphQLOperationError` is acceptable, presenters use `instanceof`), A83 (two apps get distinct instances and caches, proven in Task 11). The class is the app-neutral orchestration between the gateway interface (Task 8) and the presenters: it calls the gateway, turns an error envelope into a thrown `GraphQLOperationError`, maps DTOs with the Task 8 mappers and caches the workflow list. `createImplementation` stores the abstraction and the dependencies as metadata on the class it is given and returns that same class, so `ReviewUseCases` is **never** passed to `createImplementation`: a shared class bound under two apps' tokens would collide and the last call would silently win. Each app subclasses it once in its own file (`class CmsReviewUseCasesImpl extends ReviewUseCases implements CmsReviewUseCases.Interface {}`) and registers `CmsReviewUseCases.createImplementation({ implementation: CmsReviewUseCasesImpl, dependencies: [CmsReviewGateway] })` as a singleton (Tasks 11 and 12), so each app has its own instance, gateway and cache.

- Every method calls its gateway method inline and has one throw site for the error envelope: `throw new GraphQLOperationError({ message: error.message ?? "The request failed.", code: error.code, data: error.data })`. There is no wrapper helper around the gateway call or around the error construction (Global Constraints: no helper that wraps a dependency call). A mutation or read that resolves with neither `data` nor `error` is a protocol breach and is thrown the same way (message "The request failed.", code `null`); only `getTargetReview` returns `null` for `data: null`, because "no review" is a normal answer.
- `getBoundWorkflow(namespace)` loads `listWorkflows` once per instance. The in-flight or finished load is kept as a `Promise`, so concurrent callers share one request. A rejection (transport error or error envelope) clears the stored promise (only if it is still the same promise), so the next call retries; a loaded list is kept, including a namespace that no workflow binds (`null`, A74). The workflow found is the mapped one whose `namespaces` contain the namespace.
- Transport failures are not caught anywhere else: a rejected gateway promise passes through unchanged (same object).
- `listReviews` returns `{ items, meta }` where `items` are `ReviewWithFlags` (not rows; rows are the list presenter's business, R234) and an absent `meta` becomes `{ cursor: null, hasMoreItems: false }`.
- The class is exported plain (no `createImplementation`, no abstraction metadata); the barrel is not touched (R-k, deep-path imports).

**Files:**
- Modify: `packages/app-workflows/package.json` (dependency `@webiny/di`)
- Create: `packages/app-workflows/src/review/useCases/ReviewUseCases.ts`
- Create: `packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts`

**Interfaces:**
- Consumes: Task 8 (`IReviewGateway` and its parameter types, `IReviewUseCases`, `ReviewListPage`, `ReviewErrorDto`, the DTOs, `mapReview`, `mapReviewWithFlags`, `mapWorkflow`, `mapStepCandidate`, `ReviewWorkflow`, `StepCandidate`, `Review`, `ReviewWithFlags`, `ReviewTarget`, the DTO builders of `src/review/testing/reviewFixtures.ts`, imported `~/review/testing/reviewFixtures.js`); Task 6 (`GraphQLOperationError`, imported `@webiny/app/errors/index.js`; `yarn build -p @webiny/app --no-cache` first, as Task 6 requires for every task that imports it).
- Produces: `class ReviewUseCases implements IReviewUseCases`, `constructor(gateway: IReviewGateway)`, exported plain, to be subclassed once per app (Tasks 11 and 12 register the subclasses).

- [ ] **Step 1: Write the failing tests**

In `packages/app-workflows/package.json` add `"@webiny/di": "^1.1.0"` to `dependencies` (after `@webiny/app-admin`, keys sorted; the test below imports `Container`) and run `yarn > /dev/null 2>&1`.

Create `packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { createAbstraction } from "@webiny/feature/admin";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewUseCases } from "./ReviewUseCases.js";
import type { IReviewUseCases } from "./IReviewUseCases.js";
import type { ApproveReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { CancelForDeleteParams } from "~/review/gateway/IReviewGateway.js";
import type { CancelReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { IReviewGateway } from "~/review/gateway/IReviewGateway.js";
import type { ListReviewsParams } from "~/review/gateway/IReviewGateway.js";
import type { ListReviewStepCandidatesParams } from "~/review/gateway/IReviewGateway.js";
import type { ListStepCandidatesParams } from "~/review/gateway/IReviewGateway.js";
import type { ReassignReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { RejectReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { RequestReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { ReviewStepRef } from "~/review/gateway/IReviewGateway.js";
import type { TakeOverReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { ReviewErrorDto } from "~/review/gateway/dto.js";
import type { WorkflowDto } from "~/review/gateway/dto.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { createViewerFlagsDto } from "~/review/testing/reviewFixtures.js";

type FakeGateway = { [K in keyof IReviewGateway]: Mock };

const createFakeGateway = (): FakeGateway => {
    return {
        listWorkflows: vi.fn(),
        getTargetReview: vi.fn(),
        getReview: vi.fn(),
        listStepCandidates: vi.fn(),
        listReviewStepCandidates: vi.fn(),
        listReviews: vi.fn(),
        requestReview: vi.fn(),
        startStep: vi.fn(),
        takeOverStep: vi.fn(),
        reassignStep: vi.fn(),
        approveStep: vi.fn(),
        rejectStep: vi.fn(),
        cancelReview: vi.fn(),
        cancelForDelete: vi.fn()
    };
};

const createWorkflowDto = (id: string, models: string[]): WorkflowDto => {
    return {
        id,
        name: `Workflow ${id}`,
        models,
        steps: [
            {
                id: "step-1",
                title: "Editorial check",
                color: "#2f80ed",
                description: null,
                type: "review",
                config: {
                    teams: ["team-1"],
                    assignment: { strategy: "none", allowManualPick: true, rules: [] }
                }
            }
        ]
    };
};

const errorDto: ReviewErrorDto = {
    code: "Workflows/Review/StepNotCurrent",
    message: "The step is not the current step.",
    data: { reviewId: "review-1", stepId: "step-1" }
};

const target: ReviewTarget = { namespace: "cms.article", targetRevisionId: "entry-1#0001" };
const stepRef: ReviewStepRef = { reviewId: "review-1", stepId: "step-1" };
const requestParams: RequestReviewParams = {
    target,
    title: "Launch article",
    picks: [{ stepId: "step-1", userId: "user-9" }]
};
const takeOverParams: TakeOverReviewParams = { ...stepRef, notifyPreviousOwner: true };
const reassignParams: ReassignReviewParams = { ...stepRef, userId: "user-9" };
const approveParams: ApproveReviewParams = { ...stepRef, comment: "Looks good." };
const rejectParams: RejectReviewParams = { ...stepRef, comment: "The headline is wrong." };
const cancelParams: CancelReviewParams = { reviewId: "review-1" };
const candidatesParams: ListStepCandidatesParams = {
    workflowId: "workflow-1",
    stepId: "step-1",
    target
};
const reviewCandidatesParams: ListReviewStepCandidatesParams = stepRef;
const listParams: ListReviewsParams = {
    list: "myRequests",
    where: { modelId: "article", titleContains: "launch", reviewState: "inProgress" },
    sort: "lastChangedOn_DESC",
    limit: 20,
    after: "cursor-1"
};
const cancelForDeleteParams: CancelForDeleteParams = {
    namespace: "cms.article",
    targetId: "entry-1",
    targetRevisionId: "entry-1#0002",
    action: "delete"
};

type ActionMethod =
    | "requestReview"
    | "startStep"
    | "takeOverStep"
    | "reassignStep"
    | "approveStep"
    | "rejectStep"
    | "cancelReview";

interface ActionCase {
    method: ActionMethod;
    params: unknown;
    run: (useCases: ReviewUseCases) => Promise<Review>;
}

const actionCases: ActionCase[] = [
    {
        method: "requestReview",
        params: requestParams,
        run: useCases => useCases.requestReview(requestParams)
    },
    { method: "startStep", params: stepRef, run: useCases => useCases.startStep(stepRef) },
    {
        method: "takeOverStep",
        params: takeOverParams,
        run: useCases => useCases.takeOverStep(takeOverParams)
    },
    {
        method: "reassignStep",
        params: reassignParams,
        run: useCases => useCases.reassignStep(reassignParams)
    },
    {
        method: "approveStep",
        params: approveParams,
        run: useCases => useCases.approveStep(approveParams)
    },
    {
        method: "rejectStep",
        params: rejectParams,
        run: useCases => useCases.rejectStep(rejectParams)
    },
    {
        method: "cancelReview",
        params: cancelParams,
        run: useCases => useCases.cancelReview(cancelParams)
    }
];

interface OperationCase {
    name: string;
    method: keyof IReviewGateway;
    run: (useCases: ReviewUseCases) => Promise<unknown>;
}

const operationCases: OperationCase[] = [
    {
        name: "getBoundWorkflow",
        method: "listWorkflows",
        run: useCases => useCases.getBoundWorkflow("cms.article")
    },
    {
        name: "getTargetReview",
        method: "getTargetReview",
        run: useCases => useCases.getTargetReview(target)
    },
    { name: "getReview", method: "getReview", run: useCases => useCases.getReview("review-1") },
    {
        name: "listStepCandidates",
        method: "listStepCandidates",
        run: useCases => useCases.listStepCandidates(candidatesParams)
    },
    {
        name: "listReviewStepCandidates",
        method: "listReviewStepCandidates",
        run: useCases => useCases.listReviewStepCandidates(reviewCandidatesParams)
    },
    {
        name: "listReviews",
        method: "listReviews",
        run: useCases => useCases.listReviews(listParams)
    },
    ...actionCases.map((actionCase): OperationCase => {
        return { name: actionCase.method, method: actionCase.method, run: actionCase.run };
    }),
    {
        name: "cancelForDelete",
        method: "cancelForDelete",
        run: useCases => useCases.cancelForDelete(cancelForDeleteParams)
    }
];

describe("ReviewUseCases", () => {
    let gateway: FakeGateway;
    let useCases: ReviewUseCases;

    beforeEach(() => {
        gateway = createFakeGateway();
        useCases = new ReviewUseCases(gateway);
    });

    describe("getBoundWorkflow", () => {
        it("returns the mapped workflow that binds the namespace", async () => {
            gateway.listWorkflows.mockResolvedValue({
                data: [
                    createWorkflowDto("workflow-1", ["cms.article"]),
                    createWorkflowDto("workflow-2", ["wb.page"])
                ],
                error: null
            });

            const workflow = await useCases.getBoundWorkflow("wb.page");

            expect(workflow).toEqual({
                id: "workflow-2",
                name: "Workflow workflow-2",
                namespaces: ["wb.page"],
                steps: [
                    {
                        id: "step-1",
                        title: "Editorial check",
                        color: "#2f80ed",
                        description: null,
                        type: "review",
                        allowManualPick: true
                    }
                ]
            });
        });

        it("loads the list once for several namespaces and several calls", async () => {
            gateway.listWorkflows.mockResolvedValue({
                data: [createWorkflowDto("workflow-1", ["cms.article"])],
                error: null
            });

            const first = await useCases.getBoundWorkflow("cms.article");
            const second = await useCases.getBoundWorkflow("cms.article");
            const other = await useCases.getBoundWorkflow("cms.page");

            expect(first?.id).toBe("workflow-1");
            expect(second?.id).toBe("workflow-1");
            expect(other).toBeNull();
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(1);
        });

        it("caches a namespace without a workflow as null (A74)", async () => {
            gateway.listWorkflows.mockResolvedValue({ data: [], error: null });

            const first = await useCases.getBoundWorkflow("cms.article");
            const second = await useCases.getBoundWorkflow("cms.article");

            expect(first).toBeNull();
            expect(second).toBeNull();
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(1);
        });

        it("shares one request between concurrent callers", async () => {
            gateway.listWorkflows.mockResolvedValue({
                data: [createWorkflowDto("workflow-1", ["cms.article"])],
                error: null
            });

            const [first, second] = await Promise.all([
                useCases.getBoundWorkflow("cms.article"),
                useCases.getBoundWorkflow("cms.article")
            ]);

            expect(first?.id).toBe("workflow-1");
            expect(second?.id).toBe("workflow-1");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(1);
        });

        it("does not cache an envelope error, the next call loads again", async () => {
            gateway.listWorkflows.mockResolvedValueOnce({ data: null, error: errorDto });
            gateway.listWorkflows.mockResolvedValueOnce({
                data: [createWorkflowDto("workflow-1", ["cms.article"])],
                error: null
            });

            await expect(useCases.getBoundWorkflow("cms.article")).rejects.toBeInstanceOf(
                GraphQLOperationError
            );
            const workflow = await useCases.getBoundWorkflow("cms.article");

            expect(workflow?.id).toBe("workflow-1");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("does not cache a transport failure, the next call loads again", async () => {
            const failure = new Error("Network down.");
            gateway.listWorkflows.mockRejectedValueOnce(failure);
            gateway.listWorkflows.mockResolvedValueOnce({
                data: [createWorkflowDto("workflow-1", ["cms.article"])],
                error: null
            });

            await expect(useCases.getBoundWorkflow("cms.article")).rejects.toBe(failure);
            const workflow = await useCases.getBoundWorkflow("cms.article");

            expect(workflow?.id).toBe("workflow-1");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("does not share a cache between two instances", async () => {
            gateway.listWorkflows.mockResolvedValue({
                data: [createWorkflowDto("workflow-1", ["cms.article"])],
                error: null
            });
            const other = new ReviewUseCases(gateway);

            await useCases.getBoundWorkflow("cms.article");
            await other.getBoundWorkflow("cms.article");

            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });
    });

    describe("reads", () => {
        it("getTargetReview passes the target and maps the review with its flags", async () => {
            gateway.getTargetReview.mockResolvedValue({
                data: createReviewWithFlagsDto({
                    flags: createViewerFlagsDto({ canApprove: true })
                }),
                error: null
            });

            const result = await useCases.getTargetReview(target);

            expect(gateway.getTargetReview).toHaveBeenCalledWith(target);
            expect(result?.review.id).toBe("review-1");
            expect(result?.review.namespace).toBe("cms.article");
            expect(result?.flags.canApprove).toBe(true);
        });

        it("getTargetReview returns null when there is no review", async () => {
            gateway.getTargetReview.mockResolvedValue({ data: null, error: null });

            await expect(useCases.getTargetReview(target)).resolves.toBeNull();
        });

        it("getReview passes the id and maps the review with its flags", async () => {
            gateway.getReview.mockResolvedValue({
                data: createReviewWithFlagsDto({ review: createReviewDto({ id: "review-7" }) }),
                error: null
            });

            const result = await useCases.getReview("review-7");

            expect(gateway.getReview).toHaveBeenCalledWith("review-7");
            expect(result.review.id).toBe("review-7");
            expect(result.flags.canStart).toBe(true);
        });

        it("getReview throws when the server answers with neither data nor error", async () => {
            gateway.getReview.mockResolvedValue({ data: null, error: null });

            await expect(useCases.getReview("review-7")).rejects.toMatchObject({
                name: "GraphQLOperationError",
                message: "The request failed.",
                code: null
            });
        });

        it("listStepCandidates passes the params and maps the candidates", async () => {
            gateway.listStepCandidates.mockResolvedValue({
                data: [
                    { id: "user-1", displayName: "Ada", excluded: false, excludedReason: null },
                    { id: "user-2", displayName: "Grace", excluded: true, excludedReason: "On leave." }
                ],
                error: null
            });

            const result = await useCases.listStepCandidates(candidatesParams);

            expect(gateway.listStepCandidates).toHaveBeenCalledWith(candidatesParams);
            expect(result).toEqual([
                { id: "user-1", displayName: "Ada", excluded: false, excludedReason: null },
                { id: "user-2", displayName: "Grace", excluded: true, excludedReason: "On leave." }
            ]);
        });

        it("listReviewStepCandidates passes the params and maps the candidates", async () => {
            gateway.listReviewStepCandidates.mockResolvedValue({
                data: [{ id: "user-1", displayName: "Ada", excluded: false, excludedReason: null }],
                error: null
            });

            const result = await useCases.listReviewStepCandidates(reviewCandidatesParams);

            expect(gateway.listReviewStepCandidates).toHaveBeenCalledWith(reviewCandidatesParams);
            expect(result).toEqual([
                { id: "user-1", displayName: "Ada", excluded: false, excludedReason: null }
            ]);
        });
    });

    describe("listReviews", () => {
        it("passes the params untouched and returns mapped items with the meta", async () => {
            gateway.listReviews.mockResolvedValue({
                data: [
                    createReviewWithFlagsDto({ review: createReviewDto({ id: "review-1" }) }),
                    createReviewWithFlagsDto({ review: createReviewDto({ id: "review-2" }) })
                ],
                meta: { cursor: "cursor-2", hasMoreItems: true },
                error: null
            });

            const page = await useCases.listReviews(listParams);

            expect(gateway.listReviews).toHaveBeenCalledWith(listParams);
            expect(page.items.map(item => item.review.id)).toEqual(["review-1", "review-2"]);
            expect(page.items[0].review.namespace).toBe("cms.article");
            expect(page.meta).toEqual({ cursor: "cursor-2", hasMoreItems: true });
        });

        it("returns an empty page that still has more items", async () => {
            gateway.listReviews.mockResolvedValue({
                data: [],
                meta: { cursor: "cursor-9", hasMoreItems: true },
                error: null
            });

            const page = await useCases.listReviews(listParams);

            expect(page.items).toEqual([]);
            expect(page.meta).toEqual({ cursor: "cursor-9", hasMoreItems: true });
        });

        it("defaults an absent meta to no more items", async () => {
            gateway.listReviews.mockResolvedValue({ data: [], meta: null, error: null });

            const page = await useCases.listReviews(listParams);

            expect(page.meta).toEqual({ cursor: null, hasMoreItems: false });
        });
    });

    describe("actions", () => {
        it.each(actionCases)("$method passes the params and maps the review", async actionCase => {
            gateway[actionCase.method].mockResolvedValue({
                data: createReviewDto({ id: "review-5" }),
                error: null
            });

            const result = await actionCase.run(useCases);

            expect(gateway[actionCase.method]).toHaveBeenCalledTimes(1);
            expect(gateway[actionCase.method]).toHaveBeenCalledWith(actionCase.params);
            expect(result.id).toBe("review-5");
            expect(result.namespace).toBe("cms.article");
        });

        it("approveStep keeps a null comment", async () => {
            gateway.approveStep.mockResolvedValue({ data: createReviewDto(), error: null });

            await useCases.approveStep({ ...stepRef, comment: null });

            expect(gateway.approveStep).toHaveBeenCalledWith({ ...stepRef, comment: null });
        });
    });

    describe("cancelForDelete", () => {
        it("passes the params and maps every cancelled review", async () => {
            gateway.cancelForDelete.mockResolvedValue({
                data: [createReviewDto({ id: "review-1" }), createReviewDto({ id: "review-2" })],
                error: null
            });

            const result = await useCases.cancelForDelete(cancelForDeleteParams);

            expect(gateway.cancelForDelete).toHaveBeenCalledWith(cancelForDeleteParams);
            expect(result.map(review => review.id)).toEqual(["review-1", "review-2"]);
        });

        it("accepts no target revision (a whole-target cancel)", async () => {
            gateway.cancelForDelete.mockResolvedValue({ data: [], error: null });
            const params: CancelForDeleteParams = {
                namespace: "wb.page",
                targetId: "page-1",
                targetRevisionId: null,
                action: "trash"
            };

            const result = await useCases.cancelForDelete(params);

            expect(gateway.cancelForDelete).toHaveBeenCalledWith(params);
            expect(result).toEqual([]);
        });
    });

    describe("per-app subclasses (one container, two apps)", () => {
        const GatewayA = createAbstraction<IReviewGateway>("Test/GatewayA");
        const GatewayB = createAbstraction<IReviewGateway>("Test/GatewayB");
        const UseCasesA = createAbstraction<IReviewUseCases>("Test/UseCasesA");
        const UseCasesB = createAbstraction<IReviewUseCases>("Test/UseCasesB");

        class UseCasesAImpl extends ReviewUseCases implements UseCasesA.Interface {}
        class UseCasesBImpl extends ReviewUseCases implements UseCasesB.Interface {}

        const BoundA = UseCasesA.createImplementation({
            implementation: UseCasesAImpl,
            dependencies: [GatewayA]
        });
        const BoundB = UseCasesB.createImplementation({
            implementation: UseCasesBImpl,
            dependencies: [GatewayB]
        });

        it("binds each subclass to its own gateway with its own instance and cache", async () => {
            const gatewayA = createFakeGateway();
            const gatewayB = createFakeGateway();
            gatewayA.listWorkflows.mockResolvedValue({
                data: [createWorkflowDto("workflow-a", ["cms.article"])],
                error: null
            });
            gatewayB.listWorkflows.mockResolvedValue({
                data: [createWorkflowDto("workflow-b", ["wb.page"])],
                error: null
            });
            const container = new Container();
            container.registerInstance(GatewayA, gatewayA);
            container.registerInstance(GatewayB, gatewayB);
            container.register(BoundA).inSingletonScope();
            container.register(BoundB).inSingletonScope();

            const a = container.resolve(UseCasesA);
            const b = container.resolve(UseCasesB);
            const workflowA = await a.getBoundWorkflow("cms.article");
            const workflowB = await b.getBoundWorkflow("wb.page");
            await a.getBoundWorkflow("cms.article");
            await b.getBoundWorkflow("wb.page");

            expect(a).not.toBe(b);
            expect(container.resolve(UseCasesA)).toBe(a);
            expect(workflowA?.id).toBe("workflow-a");
            expect(workflowB?.id).toBe("workflow-b");
            expect(await a.getBoundWorkflow("wb.page")).toBeNull();
            expect(gatewayA.listWorkflows).toHaveBeenCalledTimes(1);
            expect(gatewayB.listWorkflows).toHaveBeenCalledTimes(1);
        });

        it("the shared class carries no abstraction metadata, so it cannot be registered as is", () => {
            const container = new Container();

            expect(() => container.register(ReviewUseCases)).toThrow(
                "No abstraction metadata found"
            );
        });
    });

    describe("error mapping (R204)", () => {
        it.each(operationCases)(
            "$name turns an error envelope into a GraphQLOperationError with code, data and message",
            async operation => {
                gateway[operation.method].mockResolvedValue({
                    data: null,
                    meta: null,
                    error: errorDto
                });

                const failure = await operation.run(useCases).catch(error => error);

                expect(failure).toBeInstanceOf(GraphQLOperationError);
                expect(failure.name).toBe("GraphQLOperationError");
                expect(failure.code).toBe("Workflows/Review/StepNotCurrent");
                expect(failure.message).toBe("The step is not the current step.");
                expect(failure.data).toEqual({ reviewId: "review-1", stepId: "step-1" });
            }
        );

        it.each(operationCases)(
            "$name falls back to a generic message when the error carries none",
            async operation => {
                gateway[operation.method].mockResolvedValue({
                    data: null,
                    meta: null,
                    error: { code: null, message: null, data: null }
                });

                const failure = await operation.run(useCases).catch(error => error);

                expect(failure).toBeInstanceOf(GraphQLOperationError);
                expect(failure.message).toBe("The request failed.");
                expect(failure.code).toBeNull();
                expect(failure.data).toBeNull();
            }
        );

        it.each(operationCases)("$name lets a transport failure pass unchanged", async operation => {
            const transportFailure = new Error("Network down.");
            gateway[operation.method].mockRejectedValue(transportFailure);

            await expect(operation.run(useCases)).rejects.toBe(transportFailure);
        });

        it("throws for an action that answers with neither data nor error", async () => {
            gateway.startStep.mockResolvedValue({ data: null, error: null });

            await expect(useCases.startStep(stepRef)).rejects.toMatchObject({
                name: "GraphQLOperationError",
                message: "The request failed.",
                code: null
            });
        });
    });
});
```

- [ ] **Step 2: Run the test and expect failure**

```bash
yarn build -p @webiny/app --no-cache 2>&1 | tail -30
yarn test packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts 2>&1 | tail -50
```

Expected: the build passes (Task 6 is committed); the test FAILS with `Failed to resolve import "./ReviewUseCases.js"` (the file does not exist). Admin package: `yarn test` only (no storage variants for `app-workflows`).

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/review/useCases/ReviewUseCases.ts`:

```ts
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { ApproveReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { CancelForDeleteParams } from "~/review/gateway/IReviewGateway.js";
import type { CancelReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { IReviewGateway } from "~/review/gateway/IReviewGateway.js";
import type { ListReviewsParams } from "~/review/gateway/IReviewGateway.js";
import type { ListReviewStepCandidatesParams } from "~/review/gateway/IReviewGateway.js";
import type { ListStepCandidatesParams } from "~/review/gateway/IReviewGateway.js";
import type { ReassignReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { RejectReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { RequestReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { ReviewStepRef } from "~/review/gateway/IReviewGateway.js";
import type { TakeOverReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { IReviewUseCases } from "./IReviewUseCases.js";
import type { ReviewListPage } from "./IReviewListUseCases.js";
import type { Review } from "~/review/domain/types.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";
import type { ReviewWorkflow } from "~/review/domain/types.js";
import type { StepCandidate } from "~/review/domain/types.js";
import { mapReview } from "~/review/gateway/mapReview.js";
import { mapReviewWithFlags } from "~/review/gateway/mapReviewWithFlags.js";
import { mapStepCandidate } from "~/review/gateway/mapStepCandidate.js";
import { mapWorkflow } from "~/review/gateway/mapWorkflow.js";

const FALLBACK_MESSAGE = "The request failed.";

/**
 * The one shared implementation of the review use cases (R202). It runs the app's gateway, turns
 * an error envelope into a thrown `GraphQLOperationError` (R204, A81), lets transport errors pass
 * and caches the workflow list per instance (A74), so each app, which registers its own instance,
 * has its own cache.
 */
export class ReviewUseCases implements IReviewUseCases {
    private workflows: Promise<ReviewWorkflow[]> | null = null;

    constructor(private gateway: IReviewGateway) {}

    public async getBoundWorkflow(namespace: string): Promise<ReviewWorkflow | null> {
        const loading =
            this.workflows ??
            this.gateway.listWorkflows().then(envelope => {
                if (envelope.error || !envelope.data) {
                    throw new GraphQLOperationError({
                        message: envelope.error?.message ?? FALLBACK_MESSAGE,
                        code: envelope.error?.code ?? null,
                        data: envelope.error?.data ?? null
                    });
                }
                return envelope.data.map(mapWorkflow);
            });
        this.workflows = loading;

        try {
            const workflows = await loading;
            return workflows.find(workflow => workflow.namespaces.includes(namespace)) ?? null;
        } catch (error) {
            if (this.workflows === loading) {
                this.workflows = null;
            }
            throw error;
        }
    }

    public async getTargetReview(target: ReviewTarget): Promise<ReviewWithFlags | null> {
        const envelope = await this.gateway.getTargetReview(target);
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
        return mapReviewWithFlags(envelope.data);
    }

    public async getReview(reviewId: string): Promise<ReviewWithFlags> {
        const envelope = await this.gateway.getReview(reviewId);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReviewWithFlags(envelope.data);
    }

    public async listStepCandidates(params: ListStepCandidatesParams): Promise<StepCandidate[]> {
        const envelope = await this.gateway.listStepCandidates(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return envelope.data.map(mapStepCandidate);
    }

    public async listReviewStepCandidates(
        params: ListReviewStepCandidatesParams
    ): Promise<StepCandidate[]> {
        const envelope = await this.gateway.listReviewStepCandidates(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return envelope.data.map(mapStepCandidate);
    }

    public async listReviews(params: ListReviewsParams): Promise<ReviewListPage> {
        const envelope = await this.gateway.listReviews(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return {
            items: envelope.data.map(mapReviewWithFlags),
            meta: envelope.meta ?? { cursor: null, hasMoreItems: false }
        };
    }

    public async requestReview(params: RequestReviewParams): Promise<Review> {
        const envelope = await this.gateway.requestReview(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async startStep(params: ReviewStepRef): Promise<Review> {
        const envelope = await this.gateway.startStep(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async takeOverStep(params: TakeOverReviewParams): Promise<Review> {
        const envelope = await this.gateway.takeOverStep(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async reassignStep(params: ReassignReviewParams): Promise<Review> {
        const envelope = await this.gateway.reassignStep(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async approveStep(params: ApproveReviewParams): Promise<Review> {
        const envelope = await this.gateway.approveStep(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async rejectStep(params: RejectReviewParams): Promise<Review> {
        const envelope = await this.gateway.rejectStep(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async cancelReview(params: CancelReviewParams): Promise<Review> {
        const envelope = await this.gateway.cancelReview(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return mapReview(envelope.data);
    }

    public async cancelForDelete(params: CancelForDeleteParams): Promise<Review[]> {
        const envelope = await this.gateway.cancelForDelete(params);
        if (envelope.error || !envelope.data) {
            throw new GraphQLOperationError({
                message: envelope.error?.message ?? FALLBACK_MESSAGE,
                code: envelope.error?.code ?? null,
                data: envelope.error?.data ?? null
            });
        }
        return envelope.data.map(mapReview);
    }
}
```

The `getTargetReview` throw site reads `envelope.error.code` and `.data` directly because the branch only runs when `error` is set; the other methods use the combined `error || !data` condition and null-coalesce, so the protocol-breach case (neither field set) throws with the fallback message and code `null`. `Array.prototype.map(mapReview)` passes the mapper directly: every mapper takes exactly one parameter, so the extra `index` and `array` arguments are ignored.

- [ ] **Step 4: Run the test and expect pass**

```bash
yarn test packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts 2>&1 | tail -50
```

Expected: all PASS. If a "concurrent callers" or "does not cache an error" test fails, check that the stored promise is assigned before the first `await` (it is assigned synchronously in the method body) and that a rejection clears it only when `this.workflows === loading`.

- [ ] **Step 5: Existing tests and type check**

The Task 8 tests cover the mappers this class uses; run the two that guard its inputs, then the build, which is the type check of the co-located tests (R-e: `check:test:types` reports only `__tests__/` errors):

```bash
yarn test packages/app-workflows/src/review/gateway/mapReview.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/gateway/mapWorkflow.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: PASS, no type errors (the fake gateway `FakeGateway` is assignable to `IReviewGateway`; `gateway[operation.method]` is a `Mock`), the package builds.

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
git commit -m "feat(app-workflows): add the shared ReviewUseCases" -m "One implementation of the review use cases over the gateway interface: error envelopes become GraphQLOperationError, transport errors pass through, results are mapped, and the workflow list is loaded once per instance (a missing workflow is cached, a failed load is not)." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step fails and you fix something, rerun the chain from the top. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`. Never push or amend.

**Contract notes**

- `getBoundWorkflow` keeps a stored `Promise` of the whole mapped list (not a per-namespace map); `null` for an unbound namespace is therefore "cached" by the list itself, which is what A74 requires.
- `IReviewGateway.listWorkflows` returns the envelope with `data` or `error`; an envelope with neither is treated as a protocol breach (throws), not as an empty list. The contract does not state this case.
- The per-app subclass test pins the R237 pattern; its last test pins the "No abstraction metadata found" message of the installed `@webiny/di` (verify the exact text on the first run and adjust the assertion string, not the pattern).
- verify: `@webiny/app/errors/index.js` exports `GraphQLOperationError` after Task 6 and `yarn build -p @webiny/app --no-cache` made it resolvable for the package build; the test resolves the source through the package tsconfig `paths`.
