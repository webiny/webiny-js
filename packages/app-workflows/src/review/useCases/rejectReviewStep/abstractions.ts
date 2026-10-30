import { createAbstraction } from "@webiny/feature/admin";
import type { RejectReviewGatewayParams } from "~/review/gateway/params.js";
import type { Review } from "~/review/domain/types.js";

export type RejectReviewStepUseCaseParams = RejectReviewGatewayParams;

/*
 * Rejects a step with a comment. Throws a `GraphQLOperationError` for a server error and the
 * transport `Error` as is (R360).
 */
export interface IRejectReviewStepUseCase {
    execute(params: RejectReviewStepUseCaseParams): Promise<Review>;
}

export const RejectReviewStepUseCase = createAbstraction<IRejectReviewStepUseCase>(
    "Workflows/RejectReviewStepUseCase"
);

export namespace RejectReviewStepUseCase {
    export type Interface = IRejectReviewStepUseCase;
    export type Params = RejectReviewStepUseCaseParams;
}
