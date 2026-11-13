import type { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WORKFLOWS_PERMISSION } from "~/constants.js";
import type { IWorkflowsSecurityPermission } from "~/types.js";

/**
 * Full access or the workflows "editor" permission. Same rule as the workflow create/update/delete
 * use cases. Without authorization (tasks, scheduler) `getPermissions` returns full access.
 */
export const canManageWorkflows = async (
    identityContext: IdentityContext.Interface
): Promise<boolean> => {
    const permissions =
        await identityContext.getPermissions<IWorkflowsSecurityPermission>(WORKFLOWS_PERMISSION);

    return permissions.some(permission => {
        return permission.name === "*" || !!permission.editor;
    });
};
