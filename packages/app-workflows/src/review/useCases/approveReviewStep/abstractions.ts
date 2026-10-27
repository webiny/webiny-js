import { createAbstraction } from "@webiny/feature/admin";
import type { ApproveReviewGatewayParams } from "~/review/gateway/params.js";
import type { Review } from "~/review/domain/types.js";

export type ApproveReviewStepUseCaseParams = ApproveReviewGatewayParams;

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
