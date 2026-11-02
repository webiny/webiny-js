import { createAbstraction } from "@webiny/feature/admin";
import type { ListStepCandidatesParams } from "~/review/appGateway/IReviewAppGateway.js";
import type { StepCandidate } from "~/review/domain/types.js";

/*
 * The people who may review a step of a workflow for a content revision, before the review exists.
 * Throws a `GraphQLOperationError` for a server error and the transport `Error` as is (R360).
 */
export interface IListStepCandidatesUseCase {
    execute(params: ListStepCandidatesParams): Promise<StepCandidate[]>;
}

export const ListStepCandidatesUseCase = createAbstraction<IListStepCandidatesUseCase>(
    "Workflows/ListStepCandidatesUseCase"
);

export namespace ListStepCandidatesUseCase {
    export type Interface = IListStepCandidatesUseCase;
    export type Params = ListStepCandidatesParams;
}
