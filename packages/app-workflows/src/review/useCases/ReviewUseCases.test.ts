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
import type { GetStepRunParams } from "~/review/gateway/IReviewGateway.js";
import type { IReviewGateway } from "~/review/gateway/IReviewGateway.js";
import type { ListReviewsParams } from "~/review/gateway/IReviewGateway.js";
import type { ListBlockingReviewsParams } from "~/review/gateway/IReviewGateway.js";
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
import { createBlockingReviewDto } from "~/review/testing/reviewFixtures.js";
import { createStepRunInfoDto } from "~/review/testing/reviewFixtures.js";
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
        restartStep: vi.fn(),
        cancelForDelete: vi.fn(),
        getStepRun: vi.fn(),
        listBlockingReviews: vi.fn()
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
const stepRunParams: GetStepRunParams = { ...stepRef, taskId: "task-1" };
const blockingParams: ListBlockingReviewsParams = {
    namespace: "cms.article",
    targetIds: ["entry-1", "entry-2"]
};
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
    | "cancelReview"
    | "restartStep";

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
    },
    {
        method: "restartStep",
        params: stepRef,
        run: useCases => useCases.restartStep(stepRef)
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
                        allowManualPick: true,
                        assignedAutomatically: false
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
                    {
                        id: "user-2",
                        displayName: "Grace",
                        excluded: true,
                        excludedReason: "On leave."
                    }
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

    describe("per-app subclasses (one container, two apps)", () => {
        const GatewayA = createAbstraction<IReviewGateway>("Test/GatewayA");
        const GatewayB = createAbstraction<IReviewGateway>("Test/GatewayB");
        const UseCasesA = createAbstraction<IReviewUseCases>("Test/UseCasesA");
        const UseCasesB = createAbstraction<IReviewUseCases>("Test/UseCasesB");

        class UseCasesAImpl extends ReviewUseCases implements IReviewUseCases {}
        class UseCasesBImpl extends ReviewUseCases implements IReviewUseCases {}

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

                const failure = (await operation
                    .run(useCases)
                    .catch(error => error)) as GraphQLOperationError;

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

                const failure = (await operation
                    .run(useCases)
                    .catch(error => error)) as GraphQLOperationError;

                expect(failure).toBeInstanceOf(GraphQLOperationError);
                expect(failure.message).toBe("The request failed.");
                expect(failure.code).toBeNull();
                expect(failure.data).toBeNull();
            }
        );

        it.each(operationCases)(
            "$name lets a transport failure pass unchanged",
            async operation => {
                const transportFailure = new Error("Network down.");
                gateway[operation.method].mockRejectedValue(transportFailure);

                await expect(operation.run(useCases)).rejects.toBe(transportFailure);
            }
        );

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
