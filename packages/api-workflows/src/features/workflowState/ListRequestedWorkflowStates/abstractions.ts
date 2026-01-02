import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type {
    IListWorkflowStatesParams,
    IListWorkflowStatesResponse
} from "../ListWorkflowStates/abstractions.js";
import type { WorkflowStatePersistenceError } from "~/domain/workflowState/errors.js";

/**
 * ListRequestedWorkflowStates use case interface - filters by team membership
 */
export interface IListRequestedWorkflowStatesUseCase {
    execute(
        params?: IListWorkflowStatesParams
    ): Promise<Result<IListWorkflowStatesResponse, UseCaseError>>;
}

export interface IListRequestedWorkflowStatesUseCaseErrors {
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError =
    IListRequestedWorkflowStatesUseCaseErrors[keyof IListRequestedWorkflowStatesUseCaseErrors];

export const ListRequestedWorkflowStatesUseCase =
    createAbstraction<IListRequestedWorkflowStatesUseCase>("ListRequestedWorkflowStatesUseCase");

export namespace ListRequestedWorkflowStatesUseCase {
    export type Interface = IListRequestedWorkflowStatesUseCase;
    export type Params = IListWorkflowStatesParams;
    export type Response = IListWorkflowStatesResponse;
    export type Return = Promise<Result<IListWorkflowStatesResponse, UseCaseError>>;
    export type Error = UseCaseError;
}
