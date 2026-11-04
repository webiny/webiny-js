import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { createDeferred } from "~/editor/testing/createDeferred.js";
import type { ListReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import { ReviewGateway } from "~/review/gateway/abstractions.js";
import type { WorkflowDto } from "~/review/gateway/dto.js";
import { createWorkflowDto } from "~/review/testing/createWorkflowDto.js";
import { createFakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import type { FakeReviewGateway } from "~/review/testing/fakeReviewGateway.js";
import { createReviewDto } from "~/review/testing/reviewFixtures.js";
import { createReviewWithFlagsDto } from "~/review/testing/reviewFixtures.js";
import { ReviewRepository as RepositoryAbstraction } from "./abstractions.js";
import { ReviewRepository } from "./ReviewRepository.js";

const LIST_QUERY: ListReviewsParams = {
    list: "myRequests",
    where: { modelId: "article", titleContains: "launch", reviewState: "inProgress" },
    sort: "lastChangedOn_DESC",
    limit: 20,
    after: "cursor-1"
};

const serverError = new GraphQLOperationError({
    message: "The workflows could not be read.",
    code: "Workflows/Persistence",
    data: null
});

describe("ReviewRepository", () => {
    let gateway: FakeReviewGateway;
    let repository: RepositoryAbstraction.Interface;

    beforeEach(() => {
        gateway = createFakeReviewGateway();
        const container = new Container();
        container.registerInstance(ReviewGateway, gateway);
        container.register(ReviewRepository).inSingletonScope();
        repository = container.resolve(RepositoryAbstraction);
    });

    describe("listWorkflows (R350, Review Focus 2)", () => {
        it("asks the gateway for the namespace's app and returns that app's list, mapped", async () => {
            const workflow = createWorkflowDto("workflow-1", ["cms.article"]);
            gateway.listWorkflows.mockResolvedValue([workflow]);

            const workflows = await repository.listWorkflows("cms.article");

            expect(gateway.getApp).toHaveBeenCalledWith("cms.article");
            expect(gateway.listWorkflows).toHaveBeenCalledWith("cms");
            expect(workflows).toEqual([
                {
                    id: "workflow-1",
                    name: "Workflow workflow-1",
                    namespaces: ["cms.article"],
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
                }
            ]);
        });

        it("loads an app's list once for several namespaces of that app and later calls", async () => {
            const workflow = createWorkflowDto("workflow-1", ["cms.article"]);
            gateway.listWorkflows.mockResolvedValue([workflow]);

            await repository.listWorkflows("cms.article");
            await repository.listWorkflows("cms.article");
            await repository.listWorkflows("cms.author");

            expect(gateway.listWorkflows).toHaveBeenCalledTimes(1);
        });

        it("caches an empty list (A74)", async () => {
            gateway.listWorkflows.mockResolvedValue([]);

            const first = await repository.listWorkflows("cms.article");
            const second = await repository.listWorkflows("cms.article");

            expect(first).toEqual([]);
            expect(second).toEqual([]);
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(1);
        });

        it("shares one request between concurrent callers", async () => {
            const workflow = createWorkflowDto("workflow-1", ["cms.article"]);
            gateway.listWorkflows.mockResolvedValue([workflow]);

            const first = repository.listWorkflows("cms.article");
            const second = repository.listWorkflows("cms.author");
            const [firstList, secondList] = await Promise.all([first, second]);

            expect(firstList[0].id).toBe("workflow-1");
            expect(secondList[0].id).toBe("workflow-1");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(1);
        });

        it("keeps one list per app: the CMS and the page list load once each and never mix", async () => {
            const cmsWorkflow = createWorkflowDto("workflow-cms", ["cms.article"]);
            const wbWorkflow = createWorkflowDto("workflow-wb", ["wb.page"]);
            gateway.listWorkflows.mockImplementation(
                async (app: string): Promise<WorkflowDto[]> => {
                    if (app === "wb") {
                        return [wbWorkflow];
                    }
                    return [cmsWorkflow];
                }
            );

            const cms = await repository.listWorkflows("cms.article");
            const wb = await repository.listWorkflows("wb.page");
            await repository.listWorkflows("cms.article");
            await repository.listWorkflows("wb.page");

            expect(cms.map(workflow => workflow.id)).toEqual(["workflow-cms"]);
            expect(wb.map(workflow => workflow.id)).toEqual(["workflow-wb"]);
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
            expect(gateway.listWorkflows).toHaveBeenNthCalledWith(1, "cms");
            expect(gateway.listWorkflows).toHaveBeenNthCalledWith(2, "wb");
        });

        it("does not cache a server error: the next call loads again", async () => {
            const workflow = createWorkflowDto("workflow-1", ["cms.article"]);
            gateway.listWorkflows.mockRejectedValueOnce(serverError);
            gateway.listWorkflows.mockResolvedValueOnce([workflow]);

            await expect(repository.listWorkflows("cms.article")).rejects.toBe(serverError);
            const workflows = await repository.listWorkflows("cms.article");

            expect(workflows[0].id).toBe("workflow-1");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("does not cache a transport failure: the next call loads again", async () => {
            const transport = new Error("Network down.");
            const workflow = createWorkflowDto("workflow-1", ["cms.article"]);
            gateway.listWorkflows.mockRejectedValueOnce(transport);
            gateway.listWorkflows.mockResolvedValueOnce([workflow]);

            await expect(repository.listWorkflows("cms.article")).rejects.toBe(transport);
            const workflows = await repository.listWorkflows("cms.article");

            expect(workflows[0].id).toBe("workflow-1");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("forgets only the failed app's list: the other app stays cached", async () => {
            const wbWorkflow = createWorkflowDto("workflow-wb", ["wb.page"]);
            gateway.listWorkflows.mockResolvedValueOnce([wbWorkflow]);
            gateway.listWorkflows.mockRejectedValueOnce(serverError);

            await repository.listWorkflows("wb.page");
            await expect(repository.listWorkflows("cms.article")).rejects.toBe(serverError);
            const wb = await repository.listWorkflows("wb.page");

            expect(wb[0].id).toBe("workflow-wb");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("rejects with the gateway's plain Error for a namespace no app claims and loads nothing (R361)", async () => {
            const failure = await repository.listWorkflows("blog.post").catch(error => error);

            expect(failure).toBeInstanceOf(Error);
            expect(failure.message).toBe('No workflows app handles the namespace "blog.post".');
            expect(gateway.listWorkflows).not.toHaveBeenCalled();
        });
    });

    describe("invalidateWorkflows (R350, Review Focus 2)", () => {
        it("drops the app's cached list, so the next read loads it again", async () => {
            const before = createWorkflowDto("workflow-1", ["cms.article"]);
            const after = createWorkflowDto("workflow-2", ["cms.article"]);
            gateway.listWorkflows.mockResolvedValueOnce([before]);
            gateway.listWorkflows.mockResolvedValueOnce([after]);

            const first = await repository.listWorkflows("cms.article");
            repository.invalidateWorkflows("cms");
            const second = await repository.listWorkflows("cms.article");

            expect(first[0].id).toBe("workflow-1");
            expect(second[0].id).toBe("workflow-2");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("caches the reloaded list again", async () => {
            const workflow = createWorkflowDto("workflow-1", ["cms.article"]);
            gateway.listWorkflows.mockResolvedValue([workflow]);

            await repository.listWorkflows("cms.article");
            repository.invalidateWorkflows("cms");
            await repository.listWorkflows("cms.article");
            await repository.listWorkflows("cms.article");

            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("does nothing when nothing is cached: no request, no throw, no value", () => {
            const result = repository.invalidateWorkflows("wb");

            expect(result).toBeUndefined();
            expect(gateway.listWorkflows).not.toHaveBeenCalled();
        });

        it("keeps the other app's list (Review Focus 2)", async () => {
            const cmsWorkflow = createWorkflowDto("workflow-cms", ["cms.article"]);
            const wbWorkflow = createWorkflowDto("workflow-wb", ["wb.page"]);
            gateway.listWorkflows.mockImplementation(
                async (app: string): Promise<WorkflowDto[]> => {
                    if (app === "wb") {
                        return [wbWorkflow];
                    }
                    return [cmsWorkflow];
                }
            );

            await repository.listWorkflows("cms.article");
            await repository.listWorkflows("wb.page");
            repository.invalidateWorkflows("cms");
            await repository.listWorkflows("wb.page");
            await repository.listWorkflows("cms.article");

            expect(gateway.listWorkflows).toHaveBeenCalledTimes(3);
            expect(gateway.listWorkflows.mock.calls.map(call => call[0])).toEqual([
                "cms",
                "wb",
                "cms"
            ]);
        });

        it("drops a load that is still in flight: the next read starts a new request, and the late result does not come back", async () => {
            const first = createDeferred<WorkflowDto[]>();
            const newer = createWorkflowDto("workflow-new", ["cms.article"]);
            const older = createWorkflowDto("workflow-old", ["cms.article"]);
            gateway.listWorkflows.mockReturnValueOnce(first.promise);
            gateway.listWorkflows.mockResolvedValueOnce([newer]);

            const pending = repository.listWorkflows("cms.article");
            repository.invalidateWorkflows("cms");
            const next = await repository.listWorkflows("cms.article");

            expect(next[0].id).toBe("workflow-new");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);

            first.resolve([older]);
            const stale = await pending;

            // The caller that asked before the change still gets what it asked for.
            expect(stale[0].id).toBe("workflow-old");
            // The late result did not write itself back into the cache.
            const again = await repository.listWorkflows("cms.article");
            expect(again[0].id).toBe("workflow-new");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("keeps the newer list when a dropped load fails later", async () => {
            const first = createDeferred<WorkflowDto[]>();
            const newer = createWorkflowDto("workflow-new", ["cms.article"]);
            gateway.listWorkflows.mockReturnValueOnce(first.promise);
            gateway.listWorkflows.mockResolvedValueOnce([newer]);

            const pending = repository.listWorkflows("cms.article");
            repository.invalidateWorkflows("cms");
            await repository.listWorkflows("cms.article");
            first.reject(new Error("Network down."));

            await expect(pending).rejects.toThrow("Network down.");
            const again = await repository.listWorkflows("cms.article");

            expect(again[0].id).toBe("workflow-new");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });
    });

    describe("listReviews (R351)", () => {
        it("passes the params untouched and returns mapped items with the meta", async () => {
            const firstDto = createReviewDto({ id: "review-1" });
            const secondDto = createReviewDto({ id: "review-2" });
            const first = createReviewWithFlagsDto({ review: firstDto });
            const second = createReviewWithFlagsDto({ review: secondDto });
            gateway.listReviews.mockResolvedValue({
                data: [first, second],
                meta: { cursor: "cursor-2", hasMoreItems: true }
            });

            const page = await repository.listReviews({ app: "cms", ...LIST_QUERY });

            expect(gateway.listReviews).toHaveBeenCalledWith({ app: "cms", ...LIST_QUERY });
            expect(page.items.map(item => item.review.id)).toEqual(["review-1", "review-2"]);
            expect(page.items[0].review.namespace).toBe("cms.article");
            expect(page.meta).toEqual({ cursor: "cursor-2", hasMoreItems: true });
        });

        it("returns an empty page that still has more items", async () => {
            gateway.listReviews.mockResolvedValue({
                data: [],
                meta: { cursor: "cursor-9", hasMoreItems: true }
            });

            const page = await repository.listReviews({ app: "wb", ...LIST_QUERY });

            expect(page.items).toEqual([]);
            expect(page.meta).toEqual({ cursor: "cursor-9", hasMoreItems: true });
        });

        it("defaults a missing meta to no more items", async () => {
            gateway.listReviews.mockResolvedValue({ data: [], meta: null });

            const page = await repository.listReviews({ app: "cms", ...LIST_QUERY });

            expect(page.meta).toEqual({ cursor: null, hasMoreItems: false });
        });
    });

    describe("startStep", () => {
        it("lets a conflict pass unchanged, with its code and data", async () => {
            const conflict = new GraphQLOperationError({
                message: "The step is not the current step.",
                code: "Workflows/Review/StepNotCurrent",
                data: { reviewId: "review-1", stepId: "step-1" }
            });
            gateway.startStep.mockRejectedValue(conflict);

            const pending = repository.startStep({
                namespace: "cms.article",
                reviewId: "review-1",
                stepId: "step-1"
            });

            await expect(pending).rejects.toBe(conflict);
        });
    });
});
