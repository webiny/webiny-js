import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import type { ReviewTarget } from "@webiny/app-workflows/review/domain/types.js";
import type { ReviewDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewEnvelope } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewListEnvelope } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewWithFlagsDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { StepCandidateDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { WorkflowDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ApproveReviewParams } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";
import type { CancelReviewParams } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";
import type { ListReviewsParams } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";
import type { ListReviewStepCandidatesParams } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";
import type { ListStepCandidatesParams } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";
import type { ReassignReviewParams } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";
import type { RejectReviewParams } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";
import type { RequestReviewParams } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";
import type { ReviewStepRef } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";
import type { TakeOverReviewParams } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";
import type { WorkflowAppKind } from "@webiny/app-workflows/domain/WorkflowAppKind.js";
import { WB_PAGE_APP } from "~/constants.js";
import { WbReviewGateway as GatewayAbstraction } from "./abstractions.js";
import { assertWbPageNamespace } from "../assertWbPageNamespace.js";
import type { WbOperationResponse } from "../graphql/WbOperationResponse.js";
import type { BlockingReviewDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewStepRunInfoDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { GetStepRunParams } from "@webiny/app-workflows/review/appGateway/IReviewAppGateway.js";
import { APPROVE_WEBSITE_BUILDER_PAGE_REVIEW_STEP } from "../graphql/approveWebsiteBuilderPageReviewStep.js";
import { CANCEL_WEBSITE_BUILDER_PAGE_REVIEW } from "../graphql/cancelWebsiteBuilderPageReview.js";
import { CANCEL_WEBSITE_BUILDER_PAGE_REVIEWS_FOR_DELETE } from "../graphql/cancelWebsiteBuilderPageReviewsForDelete.js";
import { GET_WEBSITE_BUILDER_PAGE_REVIEW } from "../graphql/getWebsiteBuilderPageReview.js";
import { GET_WEBSITE_BUILDER_PAGE_TARGET_REVIEW } from "../graphql/getWebsiteBuilderPageTargetReview.js";
import { LIST_WEBSITE_BUILDER_PAGE_REVIEW_STEP_CANDIDATES } from "../graphql/listWebsiteBuilderPageReviewStepCandidates.js";
import { LIST_WEBSITE_BUILDER_PAGE_REVIEWS } from "../graphql/listWebsiteBuilderPageReviews.js";
import { LIST_WEBSITE_BUILDER_PAGE_STEP_CANDIDATES } from "../graphql/listWebsiteBuilderPageStepCandidates.js";
import { LIST_WEBSITE_BUILDER_PAGE_WORKFLOWS } from "../graphql/listWebsiteBuilderPageWorkflows.js";
import { REASSIGN_WEBSITE_BUILDER_PAGE_REVIEW_STEP } from "../graphql/reassignWebsiteBuilderPageReviewStep.js";
import { REJECT_WEBSITE_BUILDER_PAGE_REVIEW_STEP } from "../graphql/rejectWebsiteBuilderPageReviewStep.js";
import { REQUEST_WEBSITE_BUILDER_PAGE_REVIEW } from "../graphql/requestWebsiteBuilderPageReview.js";
import { START_WEBSITE_BUILDER_PAGE_REVIEW_STEP } from "../graphql/startWebsiteBuilderPageReviewStep.js";
import { TAKE_OVER_WEBSITE_BUILDER_PAGE_REVIEW_STEP } from "../graphql/takeOverWebsiteBuilderPageReviewStep.js";
import { GET_WEBSITE_BUILDER_PAGE_REVIEW_STEP_RUN } from "../graphql/getWebsiteBuilderPageReviewStepRun.js";
import { RESTART_WEBSITE_BUILDER_PAGE_REVIEW_STEP } from "../graphql/restartWebsiteBuilderPageReviewStep.js";

class WbReviewGatewayImpl implements GatewayAbstraction.Interface {
    public readonly app: WorkflowAppKind = "wb";

    constructor(private client: MainGraphQLClient.Interface) {}

    // Only the page namespace (R347).
    canHandle(namespace: string): boolean {
        return namespace === WB_PAGE_APP;
    }

    async listWorkflows(): Promise<ReviewEnvelope<WorkflowDto[]>> {
        const response = await this.client.execute<
            WbOperationResponse<"listWebsiteBuilderPageWorkflows", ReviewEnvelope<WorkflowDto[]>>
        >({
            query: LIST_WEBSITE_BUILDER_PAGE_WORKFLOWS
        });

        return response.websiteBuilder.listWebsiteBuilderPageWorkflows;
    }

    async getTargetReview(
        target: ReviewTarget
    ): Promise<ReviewEnvelope<ReviewWithFlagsDto | null>> {
        assertWbPageNamespace(target.namespace);

        const response = await this.client.execute<
            WbOperationResponse<
                "getWebsiteBuilderPageTargetReview",
                ReviewEnvelope<ReviewWithFlagsDto | null>
            >
        >({
            query: GET_WEBSITE_BUILDER_PAGE_TARGET_REVIEW,
            variables: { revisionId: target.targetRevisionId }
        });

        return response.websiteBuilder.getWebsiteBuilderPageTargetReview;
    }

    async getReview(reviewId: string): Promise<ReviewEnvelope<ReviewWithFlagsDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"getWebsiteBuilderPageReview", ReviewEnvelope<ReviewWithFlagsDto>>
        >({
            query: GET_WEBSITE_BUILDER_PAGE_REVIEW,
            variables: { id: reviewId }
        });

        return response.websiteBuilder.getWebsiteBuilderPageReview;
    }

    async listStepCandidates(
        params: ListStepCandidatesParams
    ): Promise<ReviewEnvelope<StepCandidateDto[]>> {
        assertWbPageNamespace(params.target.namespace);

        const response = await this.client.execute<
            WbOperationResponse<
                "listWebsiteBuilderPageStepCandidates",
                ReviewEnvelope<StepCandidateDto[]>
            >
        >({
            query: LIST_WEBSITE_BUILDER_PAGE_STEP_CANDIDATES,
            variables: {
                workflowId: params.workflowId,
                stepId: params.stepId,
                revisionId: params.target.targetRevisionId
            }
        });

        return response.websiteBuilder.listWebsiteBuilderPageStepCandidates;
    }

    async listReviewStepCandidates(
        params: ListReviewStepCandidatesParams
    ): Promise<ReviewEnvelope<StepCandidateDto[]>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "listWebsiteBuilderPageReviewStepCandidates",
                ReviewEnvelope<StepCandidateDto[]>
            >
        >({
            query: LIST_WEBSITE_BUILDER_PAGE_REVIEW_STEP_CANDIDATES,
            variables: { reviewId: params.reviewId, stepId: params.stepId }
        });

        return response.websiteBuilder.listWebsiteBuilderPageReviewStepCandidates;
    }

    async listReviews(params: ListReviewsParams): Promise<ReviewListEnvelope> {
        const response = await this.client.execute<
            WbOperationResponse<"listWebsiteBuilderPageReviews", ReviewListEnvelope>
        >({
            query: LIST_WEBSITE_BUILDER_PAGE_REVIEWS,
            variables: {
                list: params.list,
                where: {
                    titleContains: params.where.titleContains,
                    reviewState: params.where.reviewState,
                    stepState: params.where.stepState
                },
                sort: params.sort,
                limit: params.limit,
                after: params.after
            }
        });

        return response.websiteBuilder.listWebsiteBuilderPageReviews;
    }

    async requestReview(params: RequestReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        assertWbPageNamespace(params.target.namespace);

        const response = await this.client.execute<
            WbOperationResponse<"requestWebsiteBuilderPageReview", ReviewEnvelope<ReviewDto>>
        >({
            query: REQUEST_WEBSITE_BUILDER_PAGE_REVIEW,
            variables: {
                revisionId: params.target.targetRevisionId,
                title: params.title,
                picks: params.picks
            }
        });

        return response.websiteBuilder.requestWebsiteBuilderPageReview;
    }

    async startStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"startWebsiteBuilderPageReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: START_WEBSITE_BUILDER_PAGE_REVIEW_STEP,
            variables: { reviewId: params.reviewId, stepId: params.stepId }
        });

        return response.websiteBuilder.startWebsiteBuilderPageReviewStep;
    }

    async takeOverStep(params: TakeOverReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"takeOverWebsiteBuilderPageReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: TAKE_OVER_WEBSITE_BUILDER_PAGE_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                notifyPreviousOwner: params.notifyPreviousOwner
            }
        });

        return response.websiteBuilder.takeOverWebsiteBuilderPageReviewStep;
    }

    async reassignStep(params: ReassignReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"reassignWebsiteBuilderPageReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: REASSIGN_WEBSITE_BUILDER_PAGE_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                userId: params.userId
            }
        });

        return response.websiteBuilder.reassignWebsiteBuilderPageReviewStep;
    }

    async approveStep(params: ApproveReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"approveWebsiteBuilderPageReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: APPROVE_WEBSITE_BUILDER_PAGE_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                comment: params.comment
            }
        });

        return response.websiteBuilder.approveWebsiteBuilderPageReviewStep;
    }

    async rejectStep(params: RejectReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"rejectWebsiteBuilderPageReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: REJECT_WEBSITE_BUILDER_PAGE_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                comment: params.comment
            }
        });

        return response.websiteBuilder.rejectWebsiteBuilderPageReviewStep;
    }

    async cancelReview(params: CancelReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"cancelWebsiteBuilderPageReview", ReviewEnvelope<ReviewDto>>
        >({
            query: CANCEL_WEBSITE_BUILDER_PAGE_REVIEW,
            variables: { reviewId: params.reviewId }
        });

        return response.websiteBuilder.cancelWebsiteBuilderPageReview;
    }

    async restartStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            WbOperationResponse<"restartWebsiteBuilderPageReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: RESTART_WEBSITE_BUILDER_PAGE_REVIEW_STEP,
            variables: { reviewId: params.reviewId, stepId: params.stepId }
        });

        return response.websiteBuilder.restartWebsiteBuilderPageReviewStep;
    }

    async getStepRun(
        params: GetStepRunParams
    ): Promise<ReviewEnvelope<ReviewStepRunInfoDto | null>> {
        const response = await this.client.execute<
            WbOperationResponse<
                "getWebsiteBuilderPageReviewStepRun",
                ReviewEnvelope<ReviewStepRunInfoDto | null>
            >
        >({
            query: GET_WEBSITE_BUILDER_PAGE_REVIEW_STEP_RUN,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                taskId: params.taskId
            }
        });

        return response.websiteBuilder.getWebsiteBuilderPageReviewStepRun;
    }

    /*
     * The WB bulk delete runs per item through the decorated delete use cases, whose refusals the
     * 8a warning flow already handles, so there is nothing to pre-check (R265). No request is sent.
     */
    async listBlockingReviews(): Promise<ReviewEnvelope<BlockingReviewDto[]>> {
        return { data: [], error: null };
    }

    async cancelForDelete(params: CancelForDeleteParams): Promise<ReviewEnvelope<ReviewDto[]>> {
        assertWbPageNamespace(params.namespace);

        const response = await this.client.execute<
            WbOperationResponse<
                "cancelWebsiteBuilderPageReviewsForDelete",
                ReviewEnvelope<ReviewDto[]>
            >
        >({
            query: CANCEL_WEBSITE_BUILDER_PAGE_REVIEWS_FOR_DELETE,
            variables: {
                pageId: params.targetId,
                revisionId: params.targetRevisionId,
                action: params.action
            }
        });

        return response.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete;
    }
}

export const WbReviewGateway = GatewayAbstraction.createImplementation({
    implementation: WbReviewGatewayImpl,
    dependencies: [MainGraphQLClient]
});
