import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IWorkflowStateContextProviderParams {
    app: string;
    targetRevisionId: string;
}

/**
 * Loads the target of a new workflow state and returns the context stored on the state.
 * It is also the target access check: it must throw (e.g. `WorkflowStateNotAuthorizedError`)
 * when the current identity cannot write the target or the target cannot be read.
 */
export interface IWorkflowStateContextProvider {
    provide(params: IWorkflowStateContextProviderParams): Promise<GenericRecord>;
}

export const WorkflowStateContextProvider = createAbstraction<IWorkflowStateContextProvider>(
    "WorkflowStateContextProvider"
);

export namespace WorkflowStateContextProvider {
    export type Interface = IWorkflowStateContextProvider;
    export type Params = IWorkflowStateContextProviderParams;
}
