import type { ApproveReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { CancelReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReassignReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { RejectReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { RequestReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReviewStepRef } from "~/review/appGateway/IReviewAppGateway.js";
import type { TakeOverReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
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
