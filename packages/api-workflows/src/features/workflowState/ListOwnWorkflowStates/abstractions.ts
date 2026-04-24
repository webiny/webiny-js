import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type {
    IListWorkflowStatesParams,
    IListWorkflowStatesResponse
} from "../ListWorkflowStates/abstractions.js";
import type { WorkflowStatePersistenceError } from "~/domain/workflowState/errors.js";

/**
 * ListOwnWorkflowStates use case interface - filters by current user
 */
export interface IListOwnWorkflowStatesUseCase {
    execute(
        params?: IListWorkflowStatesParams
    ): Promise<Result<IListWorkflowStatesResponse, UseCaseError>>;
}

export interface IListOwnWorkflowStatesUseCaseErrors {
    persistence: WorkflowStatePersistenceError;
}

type UseCaseError = IListOwnWorkflowStatesUseCaseErrors[keyof IListOwnWorkflowStatesUseCaseErrors];

export const ListOwnWorkflowStatesUseCase = createAbstraction<IListOwnWorkflowStatesUseCase>(
    "ListOwnWorkflowStatesUseCase"
);

export namespace ListOwnWorkflowStatesUseCase {
    export type Interface = IListOwnWorkflowStatesUseCase;
    export type Params = IListWorkflowStatesParams;
    export type Response = IListWorkflowStatesResponse;
    export type Return = Promise<Result<IListWorkflowStatesResponse, UseCaseError>>;
    export type Error = UseCaseError;
}
