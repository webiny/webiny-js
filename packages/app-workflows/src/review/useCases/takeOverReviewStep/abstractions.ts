import { createAbstraction } from "@webiny/feature/admin";
import type { TakeOverReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface TakeOverReviewStepUseCaseParams extends TakeOverReviewParams {
    namespace: string;
}

/*
 * The viewer takes over a step another person owns. Throws a `GraphQLOperationError` for a server
 * error and the transport `Error` as is (R360).
 */
export interface ITakeOverReviewStepUseCase {
    execute(params: TakeOverReviewStepUseCaseParams): Promise<Review>;
}

export const TakeOverReviewStepUseCase = createAbstraction<ITakeOverReviewStepUseCase>(
    "Workflows/TakeOverReviewStepUseCase"
);

export namespace TakeOverReviewStepUseCase {
    export type Interface = ITakeOverReviewStepUseCase;
    export type Params = TakeOverReviewStepUseCaseParams;
}
