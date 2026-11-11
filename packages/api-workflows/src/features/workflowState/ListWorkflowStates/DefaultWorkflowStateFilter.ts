import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WorkflowStateFilter } from "./WorkflowStateFilter.js";
import type { WorkflowState } from "~/domain/workflowState/WorkflowState.js";
import { canManageWorkflows } from "~/features/shared/canManageWorkflows.js";

/**
 * Apps decorate the filter and check read access to their own targets. States of apps nobody
 * claims reach this default, which fails closed: only those who manage workflows read them.
 */
class DefaultWorkflowStateFilterImpl implements WorkflowStateFilter.Interface {
    constructor(private identityContext: IdentityContext.Interface) {}

    async filter(items: WorkflowState[]): Promise<WorkflowState[]> {
        if (items.length === 0) {
            return items;
        }
        if (await canManageWorkflows(this.identityContext)) {
            return items;
        }
        return [];
    }
}

export const DefaultWorkflowStateFilter = WorkflowStateFilter.createImplementation({
    implementation: DefaultWorkflowStateFilterImpl,
    dependencies: [IdentityContext]
});
