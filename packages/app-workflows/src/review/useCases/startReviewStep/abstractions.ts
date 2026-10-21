import { createAbstraction } from "@webiny/feature/admin";
import type { ReviewStepRef } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface StartReviewStepUseCaseParams extends ReviewStepRef {
    namespace: string;
}

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
