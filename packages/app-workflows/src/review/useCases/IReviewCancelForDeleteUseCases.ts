import type { CancelForDeleteParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ListBlockingReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { BlockingReview } from "~/review/domain/types.js";
import type { Review } from "~/review/domain/types.js";

export interface IReviewCancelForDeleteUseCases {
    cancelForDelete(params: CancelForDeleteParams): Promise<Review[]>;
    // The reviews in progress of the given targets, for the bulk pre-check (R265).
    listBlockingReviews(params: ListBlockingReviewsParams): Promise<BlockingReview[]>;
}
