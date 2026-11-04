import { createAbstraction } from "@webiny/feature/admin";
import type { ListBlockingReviewsParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { BlockingReview } from "~/review/domain/types.js";

/*
 * The reviews in progress of the given targets, for the bulk pre-check (R265). The Website
 * Builder answers an empty list without a request. Throws a `GraphQLOperationError` for a server
 * error and the transport `Error` as is (R360).
 */
export interface IListBlockingReviewsUseCase {
    execute(params: ListBlockingReviewsParams): Promise<BlockingReview[]>;
}

export const ListBlockingReviewsUseCase = createAbstraction<IListBlockingReviewsUseCase>(
    "Workflows/ListBlockingReviewsUseCase"
);

export namespace ListBlockingReviewsUseCase {
    export type Interface = IListBlockingReviewsUseCase;
    export type Params = ListBlockingReviewsParams;
}
