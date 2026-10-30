import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewStepGatewayParams } from "~/review/gateway/params.js";
import type { Review } from "~/review/domain/types.js";

export type StartReviewStepUseCaseParams = ReviewStepGatewayParams;

/*
 * The viewer starts reviewing a step. Throws a `GraphQLOperationError` for a server error and the
 * transport `Error` as is (R360).
 */
export interface IStartReviewStepUseCase {
    execute(params: StartReviewStepUseCaseParams): Promise<Review>;
}

export const StartReviewStepUseCase = createAbstraction<IStartReviewStepUseCase>(
    "Workflows/StartReviewStepUseCase"
);

export namespace StartReviewStepUseCase {
    export type Interface = IStartReviewStepUseCase;
    export type Params = StartReviewStepUseCaseParams;
}
