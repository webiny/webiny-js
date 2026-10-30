import { createAbstraction } from "@webiny/feature/admin";
import type { RequestReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

/*
 * Starts a review of a content revision. Throws a `GraphQLOperationError` for a server error and
 * the transport `Error` as is (R360).
 */
export interface IRequestReviewUseCase {
    execute(params: RequestReviewParams): Promise<Review>;
}

export const RequestReviewUseCase = createAbstraction<IRequestReviewUseCase>(
    "Workflows/RequestReviewUseCase"
);

export namespace RequestReviewUseCase {
    export type Interface = IRequestReviewUseCase;
    export type Params = RequestReviewParams;
}
