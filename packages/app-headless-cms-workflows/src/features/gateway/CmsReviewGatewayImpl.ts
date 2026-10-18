import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import type { ReviewTarget } from "@webiny/app-workflows/review/domain/types.js";
import type { ReviewDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewEnvelope } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewListEnvelope } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewWithFlagsDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { StepCandidateDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { WorkflowDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ApproveReviewParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { CancelReviewParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ListReviewsParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ListReviewStepCandidatesParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ListStepCandidatesParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ReassignReviewParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { RejectReviewParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { RequestReviewParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ReviewStepRef } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { TakeOverReviewParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { parseAppName } from "~/utils/appName.js";
import { CmsReviewGateway as GatewayAbstraction } from "./CmsReviewGateway.js";
import type { CmsOperationResponse } from "./graphql/CmsOperationResponse.js";
import type { BlockingReviewDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { ReviewStepRunInfoDto } from "@webiny/app-workflows/review/gateway/dto.js";
import type { GetStepRunParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { ListBlockingReviewsParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { APPROVE_CMS_ENTRY_REVIEW_STEP } from "./graphql/approveCmsEntryReviewStep.js";
import { CANCEL_CMS_ENTRY_REVIEW } from "./graphql/cancelCmsEntryReview.js";
import { CANCEL_CMS_ENTRY_REVIEWS_FOR_DELETE } from "./graphql/cancelCmsEntryReviewsForDelete.js";
import { GET_CMS_ENTRY_REVIEW } from "./graphql/getCmsEntryReview.js";
import { GET_CMS_ENTRY_TARGET_REVIEW } from "./graphql/getCmsEntryTargetReview.js";
import { LIST_CMS_ENTRY_REVIEW_STEP_CANDIDATES } from "./graphql/listCmsEntryReviewStepCandidates.js";
import { LIST_CMS_ENTRY_REVIEWS } from "./graphql/listCmsEntryReviews.js";
import { LIST_CMS_ENTRY_STEP_CANDIDATES } from "./graphql/listCmsEntryStepCandidates.js";
import { LIST_CMS_ENTRY_WORKFLOWS } from "./graphql/listCmsEntryWorkflows.js";
import { REASSIGN_CMS_ENTRY_REVIEW_STEP } from "./graphql/reassignCmsEntryReviewStep.js";
import { REJECT_CMS_ENTRY_REVIEW_STEP } from "./graphql/rejectCmsEntryReviewStep.js";
import { REQUEST_CMS_ENTRY_REVIEW } from "./graphql/requestCmsEntryReview.js";
import { START_CMS_ENTRY_REVIEW_STEP } from "./graphql/startCmsEntryReviewStep.js";
import { TAKE_OVER_CMS_ENTRY_REVIEW_STEP } from "./graphql/takeOverCmsEntryReviewStep.js";
import { GET_CMS_ENTRY_REVIEW_STEP_RUN } from "./graphql/getCmsEntryReviewStepRun.js";
import { LIST_CMS_ENTRY_BLOCKING_REVIEWS } from "./graphql/listCmsEntryBlockingReviews.js";
import { RESTART_CMS_ENTRY_REVIEW_STEP } from "./graphql/restartCmsEntryReviewStep.js";

class CmsReviewGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async listWorkflows(): Promise<ReviewEnvelope<WorkflowDto[]>> {
        const response = await this.client.execute<
            CmsOperationResponse<"listCmsEntryWorkflows", ReviewEnvelope<WorkflowDto[]>>
        >({
            query: LIST_CMS_ENTRY_WORKFLOWS
        });

        return response.cms.listCmsEntryWorkflows;
    }

    async getTargetReview(
        target: ReviewTarget
    ): Promise<ReviewEnvelope<ReviewWithFlagsDto | null>> {
        const modelId = parseAppName(target.namespace);

        const response = await this.client.execute<
            CmsOperationResponse<
                "getCmsEntryTargetReview",
                ReviewEnvelope<ReviewWithFlagsDto | null>
            >
        >({
            query: GET_CMS_ENTRY_TARGET_REVIEW,
            variables: { modelId, revisionId: target.targetRevisionId }
        });

        return response.cms.getCmsEntryTargetReview;
    }

    async getReview(reviewId: string): Promise<ReviewEnvelope<ReviewWithFlagsDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"getCmsEntryReview", ReviewEnvelope<ReviewWithFlagsDto>>
        >({
            query: GET_CMS_ENTRY_REVIEW,
            variables: { id: reviewId }
        });

        return response.cms.getCmsEntryReview;
    }

    async listStepCandidates(
        params: ListStepCandidatesParams
    ): Promise<ReviewEnvelope<StepCandidateDto[]>> {
        const modelId = parseAppName(params.target.namespace);

        const response = await this.client.execute<
            CmsOperationResponse<"listCmsEntryStepCandidates", ReviewEnvelope<StepCandidateDto[]>>
        >({
            query: LIST_CMS_ENTRY_STEP_CANDIDATES,
            variables: {
                workflowId: params.workflowId,
                stepId: params.stepId,
                modelId,
                revisionId: params.target.targetRevisionId
            }
        });

        return response.cms.listCmsEntryStepCandidates;
    }

    async listReviewStepCandidates(
        params: ListReviewStepCandidatesParams
    ): Promise<ReviewEnvelope<StepCandidateDto[]>> {
        const response = await this.client.execute<
            CmsOperationResponse<
                "listCmsEntryReviewStepCandidates",
                ReviewEnvelope<StepCandidateDto[]>
            >
        >({
            query: LIST_CMS_ENTRY_REVIEW_STEP_CANDIDATES,
            variables: { reviewId: params.reviewId, stepId: params.stepId }
        });

        return response.cms.listCmsEntryReviewStepCandidates;
    }

    async listReviews(params: ListReviewsParams): Promise<ReviewListEnvelope> {
        const response = await this.client.execute<
            CmsOperationResponse<"listCmsEntryReviews", ReviewListEnvelope>
        >({
            query: LIST_CMS_ENTRY_REVIEWS,
            variables: {
                list: params.list,
                where: params.where,
                sort: params.sort,
                limit: params.limit,
                after: params.after
            }
        });

        return response.cms.listCmsEntryReviews;
    }

    async requestReview(params: RequestReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const modelId = parseAppName(params.target.namespace);

        const response = await this.client.execute<
            CmsOperationResponse<"requestCmsEntryReview", ReviewEnvelope<ReviewDto>>
        >({
            query: REQUEST_CMS_ENTRY_REVIEW,
            variables: {
                modelId,
                revisionId: params.target.targetRevisionId,
                title: params.title,
                picks: params.picks
            }
        });

        return response.cms.requestCmsEntryReview;
    }

    async startStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"startCmsEntryReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: START_CMS_ENTRY_REVIEW_STEP,
            variables: { reviewId: params.reviewId, stepId: params.stepId }
        });

        return response.cms.startCmsEntryReviewStep;
    }

    async takeOverStep(params: TakeOverReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"takeOverCmsEntryReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: TAKE_OVER_CMS_ENTRY_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                notifyPreviousOwner: params.notifyPreviousOwner
            }
        });

        return response.cms.takeOverCmsEntryReviewStep;
    }

    async reassignStep(params: ReassignReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"reassignCmsEntryReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: REASSIGN_CMS_ENTRY_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                userId: params.userId
            }
        });

        return response.cms.reassignCmsEntryReviewStep;
    }

    async approveStep(params: ApproveReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"approveCmsEntryReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: APPROVE_CMS_ENTRY_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                comment: params.comment
            }
        });

        return response.cms.approveCmsEntryReviewStep;
    }

    async rejectStep(params: RejectReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"rejectCmsEntryReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: REJECT_CMS_ENTRY_REVIEW_STEP,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                comment: params.comment
            }
        });

        return response.cms.rejectCmsEntryReviewStep;
    }

    async cancelReview(params: CancelReviewParams): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"cancelCmsEntryReview", ReviewEnvelope<ReviewDto>>
        >({
            query: CANCEL_CMS_ENTRY_REVIEW,
            variables: { reviewId: params.reviewId }
        });

        return response.cms.cancelCmsEntryReview;
    }

    async restartStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>> {
        const response = await this.client.execute<
            CmsOperationResponse<"restartCmsEntryReviewStep", ReviewEnvelope<ReviewDto>>
        >({
            query: RESTART_CMS_ENTRY_REVIEW_STEP,
            variables: { reviewId: params.reviewId, stepId: params.stepId }
        });

        return response.cms.restartCmsEntryReviewStep;
    }

    async getStepRun(
        params: GetStepRunParams
    ): Promise<ReviewEnvelope<ReviewStepRunInfoDto | null>> {
        const response = await this.client.execute<
            CmsOperationResponse<
                "getCmsEntryReviewStepRun",
                ReviewEnvelope<ReviewStepRunInfoDto | null>
            >
        >({
            query: GET_CMS_ENTRY_REVIEW_STEP_RUN,
            variables: {
                reviewId: params.reviewId,
                stepId: params.stepId,
                taskId: params.taskId
            }
        });

        return response.cms.getCmsEntryReviewStepRun;
    }

    async listBlockingReviews(
        params: ListBlockingReviewsParams
    ): Promise<ReviewEnvelope<BlockingReviewDto[]>> {
        const modelId = parseAppName(params.namespace);

        const response = await this.client.execute<
            CmsOperationResponse<"listCmsEntryBlockingReviews", ReviewEnvelope<BlockingReviewDto[]>>
        >({
            query: LIST_CMS_ENTRY_BLOCKING_REVIEWS,
            variables: { modelId, entryIds: params.targetIds }
        });

        return response.cms.listCmsEntryBlockingReviews;
    }

    async cancelForDelete(params: CancelForDeleteParams): Promise<ReviewEnvelope<ReviewDto[]>> {
        const modelId = parseAppName(params.namespace);

        const response = await this.client.execute<
            CmsOperationResponse<"cancelCmsEntryReviewsForDelete", ReviewEnvelope<ReviewDto[]>>
        >({
            query: CANCEL_CMS_ENTRY_REVIEWS_FOR_DELETE,
            variables: {
                modelId,
                entryId: params.targetId,
                revisionId: params.targetRevisionId,
                action: params.action
            }
        });

        return response.cms.cancelCmsEntryReviewsForDelete;
    }
}

export const CmsReviewGateway = GatewayAbstraction.createImplementation({
    implementation: CmsReviewGatewayImpl,
    dependencies: [MainGraphQLClient]
});
