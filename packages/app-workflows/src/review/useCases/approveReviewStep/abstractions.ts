import { createAbstraction } from "@webiny/feature/admin";
import type { ApproveReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface ApproveReviewStepUseCaseParams extends ApproveReviewParams {
    namespace: string;
}

/*
 * Approves a step, with an optional comment. Throws a `GraphQLOperationError` for a server error
 * and the transport `Error` as is (R360).
 */
export interface IApproveReviewStepUseCase {
    execute(params: ApproveReviewStepUseCaseParams): Promise<Review>;
}

export const ApproveReviewStepUseCase = createAbstraction<IApproveReviewStepUseCase>(
    "Workflows/ApproveReviewStepUseCase"
);

export namespace ApproveReviewStepUseCase {
    export type Interface = IApproveReviewStepUseCase;
    export type Params = ApproveReviewStepUseCaseParams;
}
