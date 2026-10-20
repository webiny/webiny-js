import { createAbstraction } from "@webiny/feature/admin";
import type { CancelReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface CancelReviewUseCaseParams extends CancelReviewParams {
    namespace: string;
}

/*
 * Cancels a review. Throws a `GraphQLOperationError` for a server error and the transport `Error`
 * as is (R360).
 */
export interface ICancelReviewUseCase {
    execute(params: CancelReviewUseCaseParams): Promise<Review>;
}

export const CancelReviewUseCase = createAbstraction<ICancelReviewUseCase>(
    "Workflows/CancelReviewUseCase"
);

export namespace CancelReviewUseCase {
    export type Interface = ICancelReviewUseCase;
    export type Params = CancelReviewUseCaseParams;
}
