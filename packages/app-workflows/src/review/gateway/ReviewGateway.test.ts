import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { ReviewAppGateway } from "~/review/appGateway/abstractions.js";
import type { ListReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReviewErrorDto } from "~/review/gateway/dto.js";
import type { StepCandidateDto } from "~/review/gateway/dto.js";
import type { WorkflowDto } from "~/review/gateway/dto.js";
import { createFakeReviewAppGateway } from "~/review/testing/fakeReviewAppGateway.js";
import type { FakeReviewAppGateway } from "~/review/testing/fakeReviewAppGateway.js";
import type { ReviewAppGatewayOperation } from "~/review/testing/fakeReviewAppGateway.js";
import { createBlockingReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { createStepRunInfoDto } from "~/review/testing/reviewFixtures.js";
import { ReviewGateway as GatewayAbstraction } from "./abstractions.js";
import { ReviewGateway } from "./ReviewGateway.js";

const CMS_NAMESPACE = "cms.article";
const WB_NAMESPACE = "wb.page";
const REVISION_ID = "entry-1#0001";

const WORKFLOW: WorkflowDto = {
    id: "workflow-1",
    name: "Article review",
    models: [CMS_NAMESPACE],
    steps: []
};

const CANDIDATE: StepCandidateDto = {
    id: "user-1",
    displayName: "Ada",
    excluded: false,
    excludedReason: null,
    teams: ["Marketing"]
};

const ERROR: ReviewErrorDto = {
    code: "Workflows/Review/StepNotCurrent",
    message: "The step is not the current step.",
    data: { reviewId: "review-1", stepId: "step-1" }
};

const LIST_QUERY: ListReviewsParams = {
    list: "myRequests",
    where: { titleContains: "launch" },
    sort: "lastChangedOn_DESC",
    limit: 20,
    after: "cursor-1"
};

const createGateway = (appGateways: FakeReviewAppGateway[]): GatewayAbstraction.Interface => {
    const container = new Container();
    for (const appGateway of appGateways) {
        container.registerInstance(ReviewAppGateway, appGateway);
    }
    container.register(ReviewGateway).inSingletonScope();
    return container.resolve(GatewayAbstraction);
};

interface NamespaceCase {
    method: ReviewAppGatewayOperation;
    // What the app gateway answers on success.
    data: unknown;
    // Runs the routing gateway's operation for one namespace.
    run: (gateway: GatewayAbstraction.Interface, namespace: string) => Promise<unknown>;
    // What the app gateway must receive: its old parameter, without the routing field.
    sent: (namespace: string) => unknown;
}

const namespaceCases: NamespaceCase[] = [
    {
        method: "getTargetReview",
        data: createReviewWithFlagsDto(),
        run: (gateway, namespace) => {
            return gateway.getTargetReview({ namespace, targetRevisionId: REVISION_ID });
        },
        sent: namespace => ({ namespace, targetRevisionId: REVISION_ID })
    },
    {
        method: "getReview",
        data: createReviewWithFlagsDto(),
        run: (gateway, namespace) => gateway.getReview({ namespace, reviewId: "review-1" }),
        sent: () => "review-1"
    },
    {
        method: "listStepCandidates",
        data: [CANDIDATE],
        run: (gateway, namespace) => {
            return gateway.listStepCandidates({
                workflowId: "workflow-1",
                stepId: "step-1",
                target: { namespace, targetRevisionId: REVISION_ID }
            });
        },
        sent: namespace => ({
            workflowId: "workflow-1",
            stepId: "step-1",
            target: { namespace, targetRevisionId: REVISION_ID }
        })
    },
    {
        method: "listReviewStepCandidates",
        data: [CANDIDATE],
        run: (gateway, namespace) => {
            return gateway.listReviewStepCandidates({
                namespace,
                reviewId: "review-1",
                stepId: "step-1"
            });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1" })
    },
    {
        method: "getStepRun",
        data: createStepRunInfoDto(),
        run: (gateway, namespace) => {
            return gateway.getStepRun({
                namespace,
                reviewId: "review-1",
                stepId: "step-1",
                taskId: "task-1"
            });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1", taskId: "task-1" })
    },
    {
        method: "requestReview",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.requestReview({
                target: { namespace, targetRevisionId: REVISION_ID },
                title: "Launch article",
                picks: [{ stepId: "step-1", userId: "user-9" }]
            });
        },
        sent: namespace => ({
            target: { namespace, targetRevisionId: REVISION_ID },
            title: "Launch article",
            picks: [{ stepId: "step-1", userId: "user-9" }]
        })
    },
    {
        method: "startStep",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.startStep({ namespace, reviewId: "review-1", stepId: "step-1" });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1" })
    },
    {
        method: "takeOverStep",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.takeOverStep({
                namespace,
                reviewId: "review-1",
                stepId: "step-1",
                notifyPreviousOwner: true
            });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1", notifyPreviousOwner: true })
    },
    {
        method: "reassignStep",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.reassignStep({
                namespace,
                reviewId: "review-1",
                stepId: "step-1",
                userId: "user-9"
            });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1", userId: "user-9" })
    },
    {
        method: "approveStep",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.approveStep({
                namespace,
                reviewId: "review-1",
                stepId: "step-1",
                comment: null
            });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1", comment: null })
    },
    {
        method: "rejectStep",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.rejectStep({
                namespace,
                reviewId: "review-1",
                stepId: "step-1",
                comment: "The headline is wrong."
            });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1", comment: "The headline is wrong." })
    },
    {
        method: "cancelReview",
        data: createReviewDto(),
        run: (gateway, namespace) => gateway.cancelReview({ namespace, reviewId: "review-1" }),
        sent: () => ({ reviewId: "review-1" })
    },
    {
        method: "restartStep",
        data: createReviewDto(),
        run: (gateway, namespace) => {
            return gateway.restartStep({ namespace, reviewId: "review-1", stepId: "step-1" });
        },
        sent: () => ({ reviewId: "review-1", stepId: "step-1" })
    },
    {
        method: "cancelForDelete",
        data: [createReviewDto()],
        run: (gateway, namespace) => {
            return gateway.cancelForDelete({
                namespace,
                targetId: "entry-1",
                targetRevisionId: null,
                action: "trash"
            });
        },
        sent: namespace => ({
            namespace,
            targetId: "entry-1",
            targetRevisionId: null,
            action: "trash"
        })
    },
    {
        method: "listBlockingReviews",
        data: [createBlockingReviewDto()],
        run: (gateway, namespace) => {
            return gateway.listBlockingReviews({ namespace, targetIds: ["entry-1", "entry-2"] });
        },
        sent: namespace => ({ namespace, targetIds: ["entry-1", "entry-2"] })
    }
];

interface EnvelopeCase {
    method: ReviewAppGatewayOperation;
    run: (gateway: GatewayAbstraction.Interface) => Promise<unknown>;
}

const envelopeCases: EnvelopeCase[] = [
    { method: "listWorkflows", run: gateway => gateway.listWorkflows("cms") },
    { method: "listReviews", run: gateway => gateway.listReviews({ app: "cms", ...LIST_QUERY }) },
    ...namespaceCases.map((testCase): EnvelopeCase => {
        return {
            method: testCase.method,
            run: gateway => testCase.run(gateway, CMS_NAMESPACE)
        };
    })
];

// Missing data is an error for every operation except the two that answer `null` (R257).
const dataRequiredCases = envelopeCases.filter(testCase => {
    return testCase.method !== "getTargetReview" && testCase.method !== "getStepRun";
});

describe("ReviewGateway", () => {
    let cms: FakeReviewAppGateway;
    let wb: FakeReviewAppGateway;
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        cms = createFakeReviewAppGateway("cms", [CMS_NAMESPACE]);
        wb = createFakeReviewAppGateway("wb", [WB_NAMESPACE]);
        gateway = createGateway([cms, wb]);
    });

    describe("routing by namespace (R347, R348)", () => {
        it.each(namespaceCases)(
            "$method runs on the CMS gateway for a CMS namespace, with its old parameter",
            async testCase => {
                cms[testCase.method].mockResolvedValue({ data: testCase.data, error: null });

                const result = await testCase.run(gateway, CMS_NAMESPACE);

                expect(result).toEqual(testCase.data);
                expect(cms[testCase.method]).toHaveBeenCalledTimes(1);
                expect(cms[testCase.method].mock.calls[0]).toStrictEqual([
                    testCase.sent(CMS_NAMESPACE)
                ]);
                expect(wb[testCase.method]).not.toHaveBeenCalled();
            }
        );

        it.each(namespaceCases)(
            "$method runs on the WB gateway for the page namespace, with its old parameter",
            async testCase => {
                wb[testCase.method].mockResolvedValue({ data: testCase.data, error: null });

                const result = await testCase.run(gateway, WB_NAMESPACE);

                expect(result).toEqual(testCase.data);
                expect(wb[testCase.method]).toHaveBeenCalledTimes(1);
                expect(wb[testCase.method].mock.calls[0]).toStrictEqual([
                    testCase.sent(WB_NAMESPACE)
                ]);
                expect(cms[testCase.method]).not.toHaveBeenCalled();
            }
        );
    });

    describe("routing by app (R348)", () => {
        it("lists the workflows of the given app and sends no parameter", async () => {
            wb.listWorkflows.mockResolvedValue({ data: [WORKFLOW], error: null });

            const result = await gateway.listWorkflows("wb");

            expect(result).toEqual([WORKFLOW]);
            expect(wb.listWorkflows.mock.calls[0]).toStrictEqual([]);
            expect(cms.listWorkflows).not.toHaveBeenCalled();
        });

        it("lists the reviews of the given app with the old parameter, and returns the data and the meta", async () => {
            const items = [createReviewWithFlagsDto()];
            cms.listReviews.mockResolvedValue({
                data: items,
                meta: { cursor: "cursor-2", hasMoreItems: true },
                error: null
            });

            const result = await gateway.listReviews({ app: "cms", ...LIST_QUERY });

            expect(result).toEqual({
                data: items,
                meta: { cursor: "cursor-2", hasMoreItems: true }
            });
            expect(cms.listReviews.mock.calls[0]).toStrictEqual([LIST_QUERY]);
            expect(wb.listReviews).not.toHaveBeenCalled();
        });

        it("returns a missing meta as null, untouched (the repository defaults it)", async () => {
            wb.listReviews.mockResolvedValue({ data: [], meta: null, error: null });

            const result = await gateway.listReviews({ app: "wb", ...LIST_QUERY });

            expect(result).toEqual({ data: [], meta: null });
        });
    });

    describe("getApp", () => {
        it("answers the app of the gateway that claims the namespace", () => {
            expect(gateway.getApp(CMS_NAMESPACE)).toBe("cms");
            expect(gateway.getApp(WB_NAMESPACE)).toBe("wb");
        });

        it("throws a plain Error for a namespace no app claims (R361)", () => {
            const read = () => gateway.getApp("blog.post");

            expect(read).toThrow('No workflows app handles the namespace "blog.post".');
        });
    });

    describe("claims (R347, A114, A115)", () => {
        it("lets the first registered claimant win", async () => {
            const greedy = createFakeReviewAppGateway("wb", [CMS_NAMESPACE, WB_NAMESPACE]);
            const cmsFirst = createGateway([cms, greedy]);
            const greedyFirst = createGateway([greedy, cms]);
            cms.getReview.mockResolvedValue({ data: createReviewWithFlagsDto(), error: null });
            greedy.getReview.mockResolvedValue({ data: createReviewWithFlagsDto(), error: null });

            await cmsFirst.getReview({ namespace: CMS_NAMESPACE, reviewId: "review-1" });
            expect(cms.getReview).toHaveBeenCalledTimes(1);
            expect(greedy.getReview).not.toHaveBeenCalled();

            await greedyFirst.getReview({ namespace: CMS_NAMESPACE, reviewId: "review-1" });
            expect(greedy.getReview).toHaveBeenCalledTimes(1);
            expect(cms.getReview).toHaveBeenCalledTimes(1);
        });

        it("still routes when the same app is registered twice, and runs the operation once (A114)", async () => {
            const cmsAgain = createFakeReviewAppGateway("cms", [CMS_NAMESPACE]);
            const twice = createGateway([cms, cmsAgain, wb]);
            cms.getReview.mockResolvedValue({ data: createReviewWithFlagsDto(), error: null });
            cms.listWorkflows.mockResolvedValue({ data: [WORKFLOW], error: null });

            await twice.getReview({ namespace: CMS_NAMESPACE, reviewId: "review-1" });
            await twice.listWorkflows("cms");

            expect(cms.getReview).toHaveBeenCalledTimes(1);
            expect(cms.listWorkflows).toHaveBeenCalledTimes(1);
            expect(cmsAgain.getReview).not.toHaveBeenCalled();
            expect(cmsAgain.listWorkflows).not.toHaveBeenCalled();
            expect(twice.getApp(WB_NAMESPACE)).toBe("wb");
        });

        it("rejects with a plain Error for a namespace no app claims and calls no app gateway (R361)", async () => {
            const failure = await gateway
                .getReview({ namespace: "blog.post", reviewId: "review-1" })
                .catch(error => error);

            expect(failure).toBeInstanceOf(Error);
            expect(failure).not.toBeInstanceOf(GraphQLOperationError);
            expect(failure.message).toBe('No workflows app handles the namespace "blog.post".');
            expect(cms.getReview).not.toHaveBeenCalled();
            expect(wb.getReview).not.toHaveBeenCalled();
        });

        it("rejects with a plain Error for an app nobody registered", async () => {
            const cmsOnly = createGateway([cms]);

            await expect(cmsOnly.listWorkflows("wb")).rejects.toThrow(
                'No workflows app is registered for "wb".'
            );
            await expect(cmsOnly.listReviews({ app: "wb", ...LIST_QUERY })).rejects.toThrow(
                'No workflows app is registered for "wb".'
            );
            expect(cms.listWorkflows).not.toHaveBeenCalled();
            expect(cms.listReviews).not.toHaveBeenCalled();
        });
    });

    describe("envelopes (R346)", () => {
        it.each(envelopeCases)(
            "$method turns an error envelope into a GraphQLOperationError with code, data and message",
            async testCase => {
                cms[testCase.method].mockResolvedValue({ data: null, meta: null, error: ERROR });

                const failure = (await testCase
                    .run(gateway)
                    .catch(error => error)) as GraphQLOperationError;

                expect(failure).toBeInstanceOf(GraphQLOperationError);
                expect(failure.code).toBe("Workflows/Review/StepNotCurrent");
                expect(failure.message).toBe("The step is not the current step.");
                expect(failure.data).toEqual({ reviewId: "review-1", stepId: "step-1" });
            }
        );

        it.each(envelopeCases)(
            "$method falls back to a generic message when the error carries none",
            async testCase => {
                cms[testCase.method].mockResolvedValue({
                    data: null,
                    meta: null,
                    error: { code: null, message: null, data: null }
                });

                const failure = (await testCase
                    .run(gateway)
                    .catch(error => error)) as GraphQLOperationError;

                expect(failure).toBeInstanceOf(GraphQLOperationError);
                expect(failure.message).toBe("The request failed.");
                expect(failure.code).toBeNull();
                expect(failure.data).toBeNull();
            }
        );

        it.each(envelopeCases)(
            "$method lets a transport rejection pass unchanged",
            async testCase => {
                const transport = new Error("Network down.");
                cms[testCase.method].mockRejectedValue(transport);

                await expect(testCase.run(gateway)).rejects.toBe(transport);
            }
        );

        it.each(dataRequiredCases)(
            "$method throws when the server answers with neither data nor error",
            async testCase => {
                cms[testCase.method].mockResolvedValue({ data: null, meta: null, error: null });

                const failure = (await testCase
                    .run(gateway)
                    .catch(error => error)) as GraphQLOperationError;

                expect(failure).toBeInstanceOf(GraphQLOperationError);
                expect(failure.message).toBe("The request failed.");
                expect(failure.code).toBeNull();
            }
        );

        it("answers null for a revision without a review (R346)", async () => {
            cms.getTargetReview.mockResolvedValue({ data: null, error: null });

            const result = await gateway.getTargetReview({
                namespace: CMS_NAMESPACE,
                targetRevisionId: REVISION_ID
            });

            expect(result).toBeNull();
        });

        it("answers null for a step run whose task is gone (R257, R346)", async () => {
            cms.getStepRun.mockResolvedValue({ data: null, error: null });

            const result = await gateway.getStepRun({
                namespace: CMS_NAMESPACE,
                reviewId: "review-1",
                stepId: "step-1",
                taskId: "task-1"
            });

            expect(result).toBeNull();
        });
    });
});
