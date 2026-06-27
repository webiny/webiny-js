import {
    WorkflowStateContextProvider,
    type IWorkflowStateContextProvider
} from "./WorkflowStateContextProvider.js";
import type { GenericRecord } from "@webiny/api/types.js";

class DefaultWorkflowStateContextProviderImpl implements IWorkflowStateContextProvider {
    async provide(): Promise<GenericRecord> {
        return {};
    }
}

export const DefaultContextProvider = WorkflowStateContextProvider.createImplementation({
    implementation: DefaultWorkflowStateContextProviderImpl,
    dependencies: []
});
