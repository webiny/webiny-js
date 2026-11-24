import type { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import type { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";

/**
 * Pages workflows are readable by those who manage workflows or can read pages. A workflow lists its
 * steps and reviewers, which an identity without access to pages has no reason to see.
 */
export const canReadWbWorkflows = async (
    workflowsPermissions: WorkflowsPermissions.Interface,
    wbPermissions: WbPermissions.Interface
): Promise<boolean> => {
    if (await workflowsPermissions.canEdit()) {
        return true;
    }
    return wbPermissions.canRead("page");
};
