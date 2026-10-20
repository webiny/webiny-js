import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { BlockingReviewDto } from "~/review/gateway/dto.js";
import type { ReviewEnvelope } from "~/review/gateway/dto.js";
import type { ReviewDto } from "~/review/gateway/dto.js";
import type { ReviewListEnvelope } from "~/review/gateway/dto.js";
import type { ReviewWithFlagsDto } from "~/review/gateway/dto.js";
import type { ReviewStepRunInfoDto } from "~/review/gateway/dto.js";
import type { StepCandidateDto } from "~/review/gateway/dto.js";
import type { WorkflowDto } from "~/review/gateway/dto.js";
import type { ReviewForDeleteAction } from "~/review/domain/types.js";
import type { ReviewTarget } from "~/review/domain/types.js";
import type { ReviewListKind } from "~/review/domain/ReviewListKind.js";
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewStateValue } from "~/review/domain/ReviewState.js";
import type { StepStateValue } from "~/review/domain/StepState.js";

export interface ListStepCandidatesParams {
    workflowId: string;
    stepId: string;
    target: ReviewTarget;
}

export interface ListReviewStepCandidatesParams {
    reviewId: string;
    stepId: string;
}

export interface ReviewStepRef {
    reviewId: string;
    stepId: string;
}

export interface RequestReviewPick {
    stepId: string;
    userId: string;
}

export interface RequestReviewParams {
    target: ReviewTarget;
    title: string;
    picks: RequestReviewPick[];
}

export interface TakeOverReviewParams extends ReviewStepRef {
    notifyPreviousOwner: boolean;
}

export interface ReassignReviewParams extends ReviewStepRef {
    userId: string;
}

export interface ApproveReviewParams extends ReviewStepRef {
    comment: string | null;
}

export interface RejectReviewParams extends ReviewStepRef {
    comment: string;
}

export interface CancelReviewParams {
    reviewId: string;
}

export interface ReviewListWhere {
    modelId?: string;
    titleContains?: string;
    reviewState?: ReviewStateValue;
    stepState?: StepStateValue;
}

export interface ListReviewsParams {
    list: ReviewListKind;
    where: ReviewListWhere;
    sort: ReviewListSort;
    limit: number;
    after: string | null;
}

export interface CancelForDeleteParams {
    namespace: string;
    targetId: string;
    targetRevisionId: string | null;
    action: ReviewForDeleteAction;
}

export interface GetStepRunParams {
    reviewId: string;
    stepId: string;
    taskId: string;
}

export interface ListBlockingReviewsParams {
    namespace: string;
    targetIds: string[];
}

/*
 * The review operations one app exposes over its own GraphQL documents (R202, R347). Every
 * envelope method resolves with the shared envelope, also when the server reports an error, and
 * rejects only on a transport failure (R204); `ReviewGateway` unwraps it once for every app. Each
 * app registers its class under the shared `ReviewAppGateway` token (`./abstractions.ts`).
 */
export interface IReviewAppGateway {
    // The app this gateway serves; the app-wide lists route by it.
    readonly app: WorkflowAppKind;
    // True for a namespace of this app (`cms.<modelId>`, `wb.page`); review-bound operations route by it.
    canHandle(namespace: string): boolean;
    listWorkflows(): Promise<ReviewEnvelope<WorkflowDto[]>>;
    getTargetReview(target: ReviewTarget): Promise<ReviewEnvelope<ReviewWithFlagsDto | null>>;
    getReview(reviewId: string): Promise<ReviewEnvelope<ReviewWithFlagsDto>>;
    listStepCandidates(
        params: ListStepCandidatesParams
    ): Promise<ReviewEnvelope<StepCandidateDto[]>>;
    listReviewStepCandidates(
        params: ListReviewStepCandidatesParams
    ): Promise<ReviewEnvelope<StepCandidateDto[]>>;
    listReviews(params: ListReviewsParams): Promise<ReviewListEnvelope>;
    requestReview(params: RequestReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    startStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>>;
    takeOverStep(params: TakeOverReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    reassignStep(params: ReassignReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    approveStep(params: ApproveReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    rejectStep(params: RejectReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    cancelReview(params: CancelReviewParams): Promise<ReviewEnvelope<ReviewDto>>;
    restartStep(params: ReviewStepRef): Promise<ReviewEnvelope<ReviewDto>>;
    cancelForDelete(params: CancelForDeleteParams): Promise<ReviewEnvelope<ReviewDto[]>>;
    getStepRun(params: GetStepRunParams): Promise<ReviewEnvelope<ReviewStepRunInfoDto | null>>;
    listBlockingReviews(
        params: ListBlockingReviewsParams
    ): Promise<ReviewEnvelope<BlockingReviewDto[]>>;
}
