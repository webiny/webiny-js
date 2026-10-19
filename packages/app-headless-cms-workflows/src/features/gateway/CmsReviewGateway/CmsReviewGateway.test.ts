import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { BLOCKING_REVIEW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_RUN_INFO_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { REVIEW_WITH_FLAGS_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { STEP_CANDIDATE_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { WORKFLOW_FIELDS } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import { CmsReviewGateway as GatewayAbstraction } from "./abstractions.js";
import { CmsReviewGateway } from "./CmsReviewGateway.js";

describe("CmsReviewGateway", () => {
    const client = { execute: vi.fn() };
    let gateway: GatewayAbstraction.Interface;

    beforeEach(() => {
        client.execute.mockReset();

        const container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        container.register(CmsReviewGateway);
        gateway = container.resolve(GatewayAbstraction);
    });

    it("lists the CMS workflows without variables", async () => {
        const envelope = { data: [{ id: "workflow-1" }], error: null };
        client.execute.mockResolvedValue({ cms: { listCmsEntryWorkflows: envelope } });

        const result = await gateway.listWorkflows();

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toBeUndefined();
        expect(request.query).toContain("listCmsEntryWorkflows");
        expect(request.query).toContain(WORKFLOW_FIELDS);
    });

    it("reads the target review by model id and revision id", async () => {
        const envelope = { data: { review: { id: "review-1" }, flags: {} }, error: null };
        client.execute.mockResolvedValue({ cms: { getCmsEntryTargetReview: envelope } });

        const result = await gateway.getTargetReview({
            namespace: "cms.article",
            targetRevisionId: "entry-1#0001"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ modelId: "article", revisionId: "entry-1#0001" });
        expect(request.query).toContain(
            "getCmsEntryTargetReview(modelId: $modelId, revisionId: $revisionId)"
        );
        expect(request.query).toContain(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS);
    });

    it("returns an empty target review as is", async () => {
        const envelope = { data: null, error: null };
        client.execute.mockResolvedValue({ cms: { getCmsEntryTargetReview: envelope } });

        const result = await gateway.getTargetReview({
            namespace: "cms.article",
            targetRevisionId: "entry-1#0001"
        });

        expect(result).toEqual({ data: null, error: null });
    });

    it("rejects a non-CMS namespace before sending a request", async () => {
        const targetReview = gateway.getTargetReview({
            namespace: "wb.page",
            targetRevisionId: "page-1#0001"
        });
        const requestReview = gateway.requestReview({
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            title: "Review",
            picks: []
        });
        const stepCandidates = gateway.listStepCandidates({
            workflowId: "workflow-1",
            stepId: "step-1",
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" }
        });
        const cancelForDelete = gateway.cancelForDelete({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: null,
            action: "trash"
        });
        const blockingReviews = gateway.listBlockingReviews({
            namespace: "wb.page",
            targetIds: ["page-1"]
        });

        await expect(targetReview).rejects.toThrow('Invalid app name: "wb.page".');
        await expect(requestReview).rejects.toThrow('Invalid app name: "wb.page".');
        await expect(stepCandidates).rejects.toThrow('Invalid app name: "wb.page".');
        await expect(cancelForDelete).rejects.toThrow('Invalid app name: "wb.page".');
        await expect(blockingReviews).rejects.toThrow('Invalid app name: "wb.page".');

        expect(client.execute).not.toHaveBeenCalled();
    });

    it("reads one review by id", async () => {
        const envelope = { data: { review: { id: "review-1" }, flags: {} }, error: null };
        client.execute.mockResolvedValue({ cms: { getCmsEntryReview: envelope } });

        const result = await gateway.getReview("review-1");

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ id: "review-1" });
        expect(request.query).toContain("getCmsEntryReview(id: $id)");
        expect(request.query).toContain(REVIEW_WITH_FLAGS_AND_ASSIGNMENT_FIELDS);
    });

    it("lists reviews with the content type and the My requests filters passed through", async () => {
        const envelope = {
            data: [{ review: { id: "review-1" }, flags: {} }],
            meta: { cursor: "cursor-2", hasMoreItems: true },
            error: null
        };
        client.execute.mockResolvedValue({ cms: { listCmsEntryReviews: envelope } });

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
                modelId: "article",
                titleContains: "launch",
                reviewState: ReviewState.Approved,
                stepState: StepState.Approved
            },
            sort: "lastChangedOn_DESC",
            limit: 20,
            after: "cursor-1"
        });
        expect(request.query).toContain("listCmsEntryReviews(");
        expect(request.query).toContain("meta");
        expect(request.query).toContain("hasMoreItems");
        expect(request.query).toContain(REVIEW_WITH_FLAGS_FIELDS);
    });

    it("lists the candidates of a step before a review exists", async () => {
        const envelope = { data: [{ id: "user-1" }], error: null };
        client.execute.mockResolvedValue({ cms: { listCmsEntryStepCandidates: envelope } });

        const result = await gateway.listStepCandidates({
            workflowId: "workflow-1",
            stepId: "step-1",
            target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" }
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            workflowId: "workflow-1",
            stepId: "step-1",
            modelId: "article",
            revisionId: "entry-1#0001"
        });
        expect(request.query).toContain("listCmsEntryStepCandidates(");
        expect(request.query).toContain(STEP_CANDIDATE_FIELDS);
    });

    it("lists who a step of a review can be reassigned to", async () => {
        const envelope = { data: [{ id: "user-2" }], error: null };
        client.execute.mockResolvedValue({ cms: { listCmsEntryReviewStepCandidates: envelope } });

        const result = await gateway.listReviewStepCandidates({
            reviewId: "review-1",
            stepId: "step-1"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1", stepId: "step-1" });
        expect(request.query).toContain("listCmsEntryReviewStepCandidates(");
        expect(request.query).toContain(STEP_CANDIDATE_FIELDS);
    });

    it("requests a review with the title and the picks", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { requestCmsEntryReview: envelope } });

        const result = await gateway.requestReview({
            target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" },
            title: "Launch article",
            picks: [{ stepId: "step-1", userId: "user-2" }]
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            modelId: "article",
            revisionId: "entry-1#0001",
            title: "Launch article",
            picks: [{ stepId: "step-1", userId: "user-2" }]
        });
        expect(request.query).toContain("requestCmsEntryReview(");
        expect(request.query).toContain(REVIEW_FIELDS);
    });

    it("starts a step", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { startCmsEntryReviewStep: envelope } });

        const result = await gateway.startStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1", stepId: "step-1" });
        expect(request.query).toContain("startCmsEntryReviewStep(");
        expect(request.query).toContain(REVIEW_FIELDS);
    });

    it("takes a step over and passes the notify choice", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { takeOverCmsEntryReviewStep: envelope } });

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
        expect(request.query).toContain("takeOverCmsEntryReviewStep(");
    });

    it("reassigns a step", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { reassignCmsEntryReviewStep: envelope } });

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
        expect(request.query).toContain("reassignCmsEntryReviewStep(");
    });

    it("approves a step with and without a comment", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { approveCmsEntryReviewStep: envelope } });

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
        expect(client.execute.mock.calls[0][0].query).toContain("approveCmsEntryReviewStep(");
    });

    it("rejects a step with the comment", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { rejectCmsEntryReviewStep: envelope } });

        const result = await gateway.rejectStep({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "The headline needs work."
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            reviewId: "review-1",
            stepId: "step-1",
            comment: "The headline needs work."
        });
        expect(request.query).toContain("rejectCmsEntryReviewStep(");
    });

    it("cancels a review", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { cancelCmsEntryReview: envelope } });

        const result = await gateway.cancelReview({ reviewId: "review-1" });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1" });
        expect(request.query).toContain("cancelCmsEntryReview(reviewId: $reviewId)");
    });

    it("cancels the reviews of a revision before a delete", async () => {
        const envelope = { data: [{ id: "review-1" }], error: null };
        client.execute.mockResolvedValue({ cms: { cancelCmsEntryReviewsForDelete: envelope } });

        const result = await gateway.cancelForDelete({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0002",
            action: "delete"
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            modelId: "article",
            entryId: "entry-1",
            revisionId: "entry-1#0002",
            action: "delete"
        });
        expect(request.query).toContain("cancelCmsEntryReviewsForDelete(");
    });

    it("cancels every review of an entry when no revision is given", async () => {
        const envelope = { data: [], error: null };
        client.execute.mockResolvedValue({ cms: { cancelCmsEntryReviewsForDelete: envelope } });

        await gateway.cancelForDelete({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: null,
            action: "trash"
        });

        expect(client.execute.mock.calls[0][0].variables).toEqual({
            modelId: "article",
            entryId: "entry-1",
            revisionId: null,
            action: "trash"
        });
    });

    it("restarts a step", async () => {
        const envelope = { data: { id: "review-1" }, error: null };
        client.execute.mockResolvedValue({ cms: { restartCmsEntryReviewStep: envelope } });

        const result = await gateway.restartStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
        expect(client.execute).toHaveBeenCalledTimes(1);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({ reviewId: "review-1", stepId: "step-1" });
        expect(request.query).toContain("mutation RestartCmsEntryReviewStep");
        expect(request.query).toContain(
            "restartCmsEntryReviewStep(reviewId: $reviewId, stepId: $stepId)"
        );
        expect(request.query).toContain(REVIEW_FIELDS);
    });

    it("returns a restart conflict as an envelope error and never throws for it", async () => {
        const envelope = {
            data: null,
            error: { code: "Workflows/Review/InvalidState", message: "Not failed.", data: null }
        };
        client.execute.mockResolvedValue({ cms: { restartCmsEntryReviewStep: envelope } });

        const result = await gateway.restartStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
    });

    it("reads the run of a step by review, step and task id", async () => {
        const envelope = { data: { taskId: "task-1", status: "done" }, error: null };
        client.execute.mockResolvedValue({ cms: { getCmsEntryReviewStepRun: envelope } });

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
        expect(request.query).toContain("query GetCmsEntryReviewStepRun");
        expect(request.query).toContain(
            "getCmsEntryReviewStepRun(reviewId: $reviewId, stepId: $stepId, taskId: $taskId)"
        );
        expect(request.query).toContain(STEP_RUN_INFO_FIELDS);
    });

    it("returns a gone task (null data) as is", async () => {
        const envelope = { data: null, error: null };
        client.execute.mockResolvedValue({ cms: { getCmsEntryReviewStepRun: envelope } });

        const result = await gateway.getStepRun({
            reviewId: "review-1",
            stepId: "step-1",
            taskId: "task-1"
        });

        expect(result).toEqual({ data: null, error: null });
    });

    it("lists the blocking reviews of entries by the model id of the namespace (R265)", async () => {
        const envelope = { data: [{ reviewId: "review-1" }], error: null };
        client.execute.mockResolvedValue({ cms: { listCmsEntryBlockingReviews: envelope } });

        const result = await gateway.listBlockingReviews({
            namespace: "cms.article",
            targetIds: ["entry-1", "entry-2"]
        });

        expect(result).toEqual(envelope);
        const request = client.execute.mock.calls[0][0];
        expect(request.variables).toEqual({
            modelId: "article",
            entryIds: ["entry-1", "entry-2"]
        });
        expect(request.query).toContain("query ListCmsEntryBlockingReviews");
        expect(request.query).toContain(
            "listCmsEntryBlockingReviews(modelId: $modelId, entryIds: $entryIds)"
        );
        expect(request.query).toContain(BLOCKING_REVIEW_FIELDS);
    });

    it("returns an envelope error as is and never throws for it", async () => {
        const envelope = {
            data: null,
            error: { code: "Workflows/Review/StepNotCurrent", message: "Not current.", data: null }
        };
        client.execute.mockResolvedValue({ cms: { startCmsEntryReviewStep: envelope } });

        const result = await gateway.startStep({ reviewId: "review-1", stepId: "step-1" });

        expect(result).toEqual(envelope);
    });

    it("lets a transport error pass through", async () => {
        client.execute.mockRejectedValue(new Error("Network down."));

        const promise = gateway.getReview("review-1");

        await expect(promise).rejects.toThrow("Network down.");
    });
});
