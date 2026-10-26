import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewStepGatewayParams } from "~/review/gateway/params.js";
import type { Review } from "~/review/domain/types.js";

export type RestartReviewStepUseCaseParams = ReviewStepGatewayParams;

/*
 * Runs a failed automated step again. Throws a `GraphQLOperationError` for a server error and the
 * transport `Error` as is (R360).
 */
export interface IRestartReviewStepUseCase {
    execute(params: RestartReviewStepUseCaseParams): Promise<Review>;
}

export const RestartReviewStepUseCase = createAbstraction<IRestartReviewStepUseCase>(
    "Workflows/RestartReviewStepUseCase"
);

export namespace RestartReviewStepUseCase {
    export type Interface = IRestartReviewStepUseCase;
    export type Params = RestartReviewStepUseCaseParams;
}
