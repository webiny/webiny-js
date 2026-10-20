import type { ListReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReviewListMeta } from "~/review/domain/types.js";
import type { ReviewWithFlags } from "~/review/domain/types.js";

export interface ReviewListPage {
    items: ReviewWithFlags[];
    meta: ReviewListMeta;
}

export interface IReviewListUseCases {
    listReviews(params: ListReviewsParams): Promise<ReviewListPage>;
}
