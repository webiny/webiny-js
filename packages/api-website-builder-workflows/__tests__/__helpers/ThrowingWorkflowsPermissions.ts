import type { Container } from "@webiny/di";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import type { WorkflowsPermissionSet } from "@webiny/api-workflows/domain/permissions/types.js";

const fail = (): never => {
    throw new Error("Loading the identity's permissions failed.");
};

/** Every `workflows` permission check throws, as a failed permission load does. */
class ThrowingWorkflowsPermissionsImpl implements WorkflowsPermissions.Interface {
    public async isFullAccess(): Promise<boolean> {
        return fail();
    }

    public async canEdit(): Promise<boolean> {
        return fail();
    }

    public async canReassign(): Promise<boolean> {
        return fail();
    }

    public async getPermissionSet(): Promise<WorkflowsPermissionSet> {
        return fail();
    }
}

/** The `workflows` permission checks throw (`legacyPlugins`). */
export const throwOnWorkflowsPermissions = (container: Container) => {
    container.registerInstance(WorkflowsPermissions, new ThrowingWorkflowsPermissionsImpl());
};
