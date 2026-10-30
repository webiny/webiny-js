import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_RUN_INFO_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { WORKFLOW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import { ReviewAppGateway as GatewayAbstraction } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { WbReviewGateway } from "./WbReviewGateway.js";

describe("WbReviewGateway", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(WbReviewGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    it("serves the wb app (R347)", () => {
        expect(gateway.app).toBe("wb");
    });

    it("claims only the page namespace (R347)", () => {
        expect(gateway.canHandle("wb.page")).toBe(true);
        expect(gateway.canHandle("wb.pages")).toBe(false);
        expect(gateway.canHandle("wb")).toBe(false);
        expect(gateway.canHandle("cms.article")).toBe(false);
        expect(client.execute).not.toHaveBeenCalled();
    });

    it("lists the page workflows without variables", async () => {
        const envelope = { data: [{ id: "workflow-1" }], error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { listWebsiteBuilderPageWorkflows: envelope }
        });

        const result = await gateway.listWorkflows();

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("websiteBuilder");
        expect(request.query).toContain("listWebsiteBuilderPageWorkflows");
        expect(request.query).toContain(WORKFLOW_FIELDS);
    });

    it("reads the target review by revision id", async () => {
        const envelope = { data: { review: { id: "review-1" }, flags: {} }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageTargetReview: envelope }
        });

        const result = await gateway.getTargetReview({
            namespace: "wb.page",
            targetRevisionId: "page-1#0001"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ revisionId: "page-1#0001" });
        expect(request.query).toContain(
            "getWebsiteBuilderPageTargetReview(revisionId: $revisionId)"
        );
        expect(request.query).toContain(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS);
    });

    it("returns an empty target review as is", async () => {
        const envelope = { data: null, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageTargetReview: envelope }
        });

        const result = await gateway.getTargetReview({
            namespace: "wb.page",
            targetRevisionId: "page-1#0001"
        });

        expect(result).toEqual({ data: null, error: null });
    });

    it("rejects a namespace other than wb.page before sending a request", async () => {
        const cmsTarget = { namespace: "cms.article", targetRevisionId: "entry-1#0001" };

        await expect(gateway.getTargetReview(cmsTarget)).rejects.toThrow(
            'Invalid app name: "cms.article".'
        );
        await expect(
            gateway.requestReview({ target: cmsTarget, title: "Review", picks: [] })
        ).rejects.toThrow('Invalid app name: "cms.article".');
        await expect(
            gateway.listStepCandidates({
                workflowId: "workflow-1",
                stepId: "step-1",
                target: cmsTarget
            })
        ).rejects.toThrow('Invalid app name: "cms.article".');
        await expect(
            gateway.cancelForDelete({
                namespace: "cms.article",
                targetId: "entry-1",
                targetRevisionId: null,
                action: "trash"
            })
        ).rejects.toThrow('Invalid app name: "cms.article".');

        expect(client.execute).not.toHaveBeenCalled();
    });

    it("reads one review by id", async () => {
        const envelope = { data: { review: { id: "review-1" }, flags: {} }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageReview: envelope }
        });

        const result = await gateway.getReview("review-1");

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ id: "review-1" });
        expect(request.query).toContain("getWebsiteBuilderPageReview(id: $id)");
        expect(request.query).toContain(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS);
    });

    it("lists reviews, passes the My requests filters and drops the content type filter", async () => {
        const envelope = {
            data: [{ review: { id: "review-1" }, flags: {} }],
            meta: { cursor: "cursor-2", hasMoreItems: true },
            error: null
        };
        client.execute.mockResolvedValue({
            websiteBuilder: { listWebsiteBuilderPageReviews: envelope }
        });

        const result = await gateway.listReviews({
            list: "myRequests",
            where: {
                modelId: "article",
                titleContains: "launch",
                reviewState: ReviewState.Approved,
                stepState: StepState.Approved
            },
            sort: "lastChangedOn_DESC",
            limit: 20,
            after: "cursor-1"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            list: "myRequests",
            where: {
                titleContains: "launch",
                reviewState: ReviewState.Approved,
                stepState: StepState.Approved
            },
            sort: "lastChangedOn_DESC",
            limit: 20,
            after: "cursor-1"
        });
        expect(request.variables.where).not.toHaveProperty("modelId");
        expect(request.query).toContain("$where: WbPageReviewListWhere");
        expect(request.query).toContain("listWebsiteBuilderPageReviews(");
        expect(request.query).toContain("meta");
        expect(request.query).toContain("hasMoreItems");
        expect(request.query).toContain(REVIEW_WITH_FLAGS_FIELDS);
    });

    it("lists the candidates of a step before a review exists", async () => {
        const envelope = { data: [{ id: "user-1" }], error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { listWebsiteBuilderPageStepCandidates: envelope }
        });

        const result = await gateway.listStepCandidates({
            workflowId: "workflow-1",
            stepId: "step-1",
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" }
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            workflowId: "workflow-1",
            stepId: "step-1",
            revisionId: "page-1#0001"
        });
        expect(request.query).toContain("listWebsiteBuilderPageStepCandidates(");
        expect(request.query).toContain(STEP_CANDIDATE_FIELDS);
    });

    it("lists who a step of a review can be reassigned to", async () => {
        const envelope = { data: [{ id: "user-2" }], error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { listWebsiteBuilderPageReviewStepCandidates: envelope }
        });

        const result = await gateway.listReviewStepCandidates({
            reviewId: "review-1",
            stepId: "step-1"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1", stepId: "step-1" });
        expect(request.query).toContain("listWebsiteBuilderPageReviewStepCandidates(");
        expect(request.query).toContain(STEP_CANDIDATE_FIELDS);
    });

    it("requests a review with the title and the picks", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { requestWebsiteBuilderPageReview: envelope }
        });

        const result = await gateway.requestReview({
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            title: "Launch page",
            picks: [{ stepId: "step-1", userId: "user-2" }]
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            revisionId: "page-1#0001",
            title: "Launch page",
            picks: [{ stepId: "step-1", userId: "user-2" }]
        });
        expect(request.query).toContain("requestWebsiteBuilderPageReview(");
        expect(request.query).toContain(REVIEW_FIELDS);
    });

    it("starts a step", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { startWebsiteBuilderPageReviewStep: envelope }
        });

        const result = await gateway.startStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1", stepId: "step-1" });
        expect(request.query).toContain("startWebsiteBuilderPageReviewStep(");
        expect(request.query).toContain(REVIEW_FIELDS);
    });

    it("takes a step over and passes the notify choice", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { takeOverWebsiteBuilderPageReviewStep: envelope }
        });

        const result = await gateway.takeOverStep({
            reviewId: "review-1",
            stepId: "step-1",
            notifyPreviousOwner: false
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            notifyPreviousOwner: false
        });
        expect(request.query).toContain("takeOverWebsiteBuilderPageReviewStep(");
    });

    it("reassigns a step", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { reassignWebsiteBuilderPageReviewStep: envelope }
        });

        const result = await gateway.reassignStep({
            reviewId: "review-1",
            stepId: "step-1",
            userId: "user-2"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            userId: "user-2"
        });
        expect(request.query).toContain("reassignWebsiteBuilderPageReviewStep(");
    });

    it("approves a step with and without a comment", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { approveWebsiteBuilderPageReviewStep: envelope }
        });

        await gateway.approveStep({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "Looks good"
        });
        const result = await gateway.approveStep({
            reviewId: "review-1",
            stepId: "step-1",
            comment: null
        });

        expect(result).toEqual(envelope);
        expect(client.execute.mock.calls[0][0].variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "Looks good"
        });
        expect(client.execute.mock.calls[1][0].variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            comment: null
        });
        expect(client.execute.mock.calls[0][0].query).toContain(
            "approveWebsiteBuilderPageReviewStep("
        );
    });

    it("rejects a step with the comment", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { rejectWebsiteBuilderPageReviewStep: envelope }
        });

        const result = await gateway.rejectStep({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "The hero image is wrong."
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "The hero image is wrong."
        });
        expect(request.query).toContain("rejectWebsiteBuilderPageReviewStep(");
    });

    it("cancels a review", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { cancelWebsiteBuilderPageReview: envelope }
        });

        const result = await gateway.cancelReview({ reviewId: "review-1" });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1" });
        expect(request.query).toContain("cancelWebsiteBuilderPageReview(reviewId: $reviewId)");
    });

    it("cancels the reviews of one page revision before a delete", async () => {
        const envelope = { data: [{ id: "review-1" }], error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { cancelWebsiteBuilderPageReviewsForDelete: envelope }
        });

        const result = await gateway.cancelForDelete({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0002",
            action: "delete"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            pageId: "page-1",
            revisionId: "page-1#0002",
            action: "delete"
        });
        expect(request.query).toContain("cancelWebsiteBuilderPageReviewsForDelete(");
    });

    it("cancels every review of a page when no revision is given", async () => {
        const envelope = { data: [], error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { cancelWebsiteBuilderPageReviewsForDelete: envelope }
        });

        await gateway.cancelForDelete({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: null,
            action: "trash"
        });

        expect(client.execute.mock.calls[0][0].variables).toEqual({
            pageId: "page-1",
            revisionId: null,
            action: "trash"
        });
    });

    it("restarts a step", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { restartWebsiteBuilderPageReviewStep: envelope }
        });

        const result = await gateway.restartStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1", stepId: "step-1" });
        expect(request.query).toContain("mutation RestartWebsiteBuilderPageReviewStep");
        expect(request.query).toContain(
            "restartWebsiteBuilderPageReviewStep(reviewId: $reviewId, stepId: $stepId)"
        );
        expect(request.query).toContain(REVIEW_FIELDS);
    });

    it("returns a restart conflict as an envelope error and never throws for it", async () => {
        const envelope = {
            data: null,
            error: { code: "Workflows/Review/InvalidState", message: "Not failed.", data: null }
        };
        client.execute.mockResolvedValue({
            websiteBuilder: { restartWebsiteBuilderPageReviewStep: envelope }
        });

        const result = await gateway.restartStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
    });

    it("reads the run of a step by review, step and task id", async () => {
        const envelope = { data: { taskId: "task-1", status: "done" }, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageReviewStepRun: envelope }
        });

        const result = await gateway.getStepRun({
            reviewId: "review-1",
            stepId: "step-1",
            taskId: "task-1"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            taskId: "task-1"
        });
        expect(request.query).toContain("query GetWebsiteBuilderPageReviewStepRun");
        expect(request.query).toContain(
            "getWebsiteBuilderPageReviewStepRun(reviewId: $reviewId, stepId: $stepId, taskId: $taskId)"
        );
        expect(request.query).toContain(STEP_RUN_INFO_FIELDS);
    });

    it("returns a gone task (null data) as is", async () => {
        const envelope = { data: null, error: null };
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageReviewStepRun: envelope }
        });

        const result = await gateway.getStepRun({
            reviewId: "review-1",
            stepId: "step-1",
            taskId: "task-1"
        });

        expect(result).toEqual({ data: null, error: null });
    });

    it("answers the blocking reviews with an empty list and sends no request (the WB bulk delete runs per item)", async () => {
        const result = await gateway.listBlockingReviews({
            namespace: "wb.page",
            targetIds: ["page-1", "page-2"]
        });

        expect(result).toEqual({ data: [], error: null });
        expect(client.execute).not.toHaveBeenCalled();
    });

    it("returns an envelope error as is and never throws for it", async () => {
        const envelope = {
            data: null,
            error: { code: "Workflows/Review/StepNotCurrent", message: "Not current.", data: null }
        };
        client.execute.mockResolvedValue({
            websiteBuilder: { startWebsiteBuilderPageReviewStep: envelope }
        });

        const result = await gateway.startStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
    });

    it("lets a transport error pass through", async () => {
        client.execute.mockRejectedValue(new Error("Network down."));

        await expect(gateway.getReview("review-1")).rejects.toThrow("Network down.");
    });
});
