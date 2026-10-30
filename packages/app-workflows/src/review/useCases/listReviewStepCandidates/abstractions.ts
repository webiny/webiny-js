import { createAbstraction } from "@webiny/feature/admin";
import type { ListReviewStepCandidatesGatewayParams } from "~/review/gateway/params.js";
import type { StepCandidate } from "~/review/domain/types.js";

export type ListReviewStepCandidatesUseCaseParams = ListReviewStepCandidatesGatewayParams;

/*
 * The people a step of an existing review may be reassigned to. Throws a `GraphQLOperationError`
 * for a server error and the transport `Error` as is (R360).
 */
export interface IListReviewStepCandidatesUseCase {
    execute(params: ListReviewStepCandidatesUseCaseParams): Promise<StepCandidate[]>;
}

export const ListReviewStepCandidatesUseCase = createAbstraction<IListReviewStepCandidatesUseCase>(
    "Workflows/ListReviewStepCandidatesUseCase"
);

export namespace ListReviewStepCandidatesUseCase {
    export type Interface = IListReviewStepCandidatesUseCase;
    export type Params = ListReviewStepCandidatesUseCaseParams;
}
