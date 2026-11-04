import { createAbstraction } from "@webiny/feature/admin";
import type { ReassignReviewGatewayParams } from "~/review/gateway/params.js";
import type { Review } from "~/review/domain/types.js";

export type ReassignReviewStepUseCaseParams = ReassignReviewGatewayParams;

/*
 * Gives a step to another reviewer. Throws a `GraphQLOperationError` for a server error and the
 * transport `Error` as is (R360).
 */
export interface IReassignReviewStepUseCase {
    execute(params: ReassignReviewStepUseCaseParams): Promise<Review>;
}

export const ReassignReviewStepUseCase = createAbstraction<IReassignReviewStepUseCase>(
    "Workflows/ReassignReviewStepUseCase"
);

export namespace ReassignReviewStepUseCase {
    export type Interface = IReassignReviewStepUseCase;
    export type Params = ReassignReviewStepUseCaseParams;
}
