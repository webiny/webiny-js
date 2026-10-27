import { createAbstraction } from "@webiny/feature/admin";
import type { CancelForDeleteParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

/*
 * Cancels the reviews in progress of a target that is about to be trashed or deleted (R265);
 * `targetRevisionId: null` cancels every revision's review. Throws a `GraphQLOperationError` for a
 * server error and the transport `Error` as is (R360).
 */
export interface ICancelReviewsForDeleteUseCase {
    execute(params: CancelForDeleteParams): Promise<Review[]>;
}

export const CancelReviewsForDeleteUseCase = createAbstraction<ICancelReviewsForDeleteUseCase>(
    "Workflows/CancelReviewsForDeleteUseCase"
);

export namespace CancelReviewsForDeleteUseCase {
    export type Interface = ICancelReviewsForDeleteUseCase;
    export type Params = CancelForDeleteParams;
}
