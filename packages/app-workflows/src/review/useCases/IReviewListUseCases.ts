import type { ListReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";

export interface IReviewListUseCases {
    listReviews(params: ListReviewsParams): Promise<ReviewListPage>;
}
