import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import {
    WorkflowStateContextProvider,
    type IWorkflowStateContextProvider
} from "./WorkflowStateContextProvider.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { WorkflowStateNotAuthorizedError } from "~/domain/workflowState/errors.js";
import { canManageWorkflows } from "~/features/shared/canManageWorkflows.js";

/**
 * Apps decorate the provider and check write access to their own targets. Targets of apps nobody
 * claims reach this default, which fails closed: only those who manage workflows may start one.
 */
class DefaultWorkflowStateContextProviderImpl implements IWorkflowStateContextProvider {
    constructor(private identityContext: IdentityContext.Interface) {}

    async provide(): Promise<GenericRecord> {
        if (!(await canManageWorkflows(this.identityContext))) {
            throw new WorkflowStateNotAuthorizedError("Not authorized!");
        }
        return {};
    }
}

export const DefaultContextProvider = WorkflowStateContextProvider.createImplementation({
    implementation: DefaultWorkflowStateContextProviderImpl,
    dependencies: [IdentityContext]
});
