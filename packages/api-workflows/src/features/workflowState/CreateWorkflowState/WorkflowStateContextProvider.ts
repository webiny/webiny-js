import { createAbstraction } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IWorkflowStateContextProviderParams {
    app: string;
    targetRevisionId: string;
}

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

class DefaultWorkflowStateContextProvider implements IWorkflowStateContextProvider {
    async provide(): Promise<GenericRecord> {
        return {};
    }
}

export const DefaultContextProvider = WorkflowStateContextProvider.createImplementation({
    implementation: DefaultWorkflowStateContextProvider,
    dependencies: []
});
