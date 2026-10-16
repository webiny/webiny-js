import type { CancelForDeleteParams } from "~/review/gateway/IReviewGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface IReviewCancelForDeleteUseCases {
    cancelForDelete(params: CancelForDeleteParams): Promise<Review[]>;
}
