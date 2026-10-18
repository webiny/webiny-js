import type { ApproveReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { CancelReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { ReassignReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { RejectReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { RequestReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { ReviewStepRef } from "~/review/gateway/IReviewGateway.js";
import type { TakeOverReviewParams } from "~/review/gateway/IReviewGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface IReviewActionUseCases {
    requestReview(params: RequestReviewParams): Promise<Review>;
    startStep(params: ReviewStepRef): Promise<Review>;
    takeOverStep(params: TakeOverReviewParams): Promise<Review>;
    reassignStep(params: ReassignReviewParams): Promise<Review>;
    approveStep(params: ApproveReviewParams): Promise<Review>;
    rejectStep(params: RejectReviewParams): Promise<Review>;
    cancelReview(params: CancelReviewParams): Promise<Review>;
    restartStep(params: ReviewStepRef): Promise<Review>;
}
