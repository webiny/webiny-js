import { createAbstraction } from "@webiny/feature/admin";
import type { ReassignReviewParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { Review } from "~/review/domain/types.js";

export interface ReassignReviewStepUseCaseParams extends ReassignReviewParams {
    namespace: string;
}

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
