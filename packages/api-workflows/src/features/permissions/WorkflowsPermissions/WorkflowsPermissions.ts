import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WORKFLOWS_PERMISSION } from "~/constants.js";
import type { IWorkflowsSecurityPermission } from "~/types.js";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import { WorkflowsPermissions as Abstraction } from "./abstractions.js";

const FULL_ACCESS_PERMISSION = `${WORKFLOWS_PERMISSION}.*`;

/**
 * Reads the identity's `workflows` permissions on every call: `IdentityContext` already caches
 * the loaded permissions per identity, and `withIdentity` can switch the identity mid-request, so
 * a second cache here could answer for the wrong identity.
 */
class WorkflowsPermissionsImpl implements Abstraction.Interface {
    public constructor(private identityContext: IdentityContext.Interface) {}

    public async isFullAccess(): Promise<boolean> {
        // `getPermission` matches patterns, so `*` matches too; with authorization disabled it
        // returns `*`.
        const permission = await this.identityContext.getPermission(FULL_ACCESS_PERMISSION);
        return permission !== null;
    }

    public async canEdit(): Promise<boolean> {
        // Granted when full access, or when any `workflows` permission (one per role) sets the flag.
        if (await this.isFullAccess()) {
            return true;
        }
        const permissions =
            await this.identityContext.getPermissions<IWorkflowsSecurityPermission>(
                WORKFLOWS_PERMISSION
            );
        return permissions.some(permission => permission.editor === true);
    }

    public async canReassign(): Promise<boolean> {
        // Granted when full access, or when any `workflows` permission (one per role) sets the flag.
        if (await this.isFullAccess()) {
            return true;
        }
        const permissions =
            await this.identityContext.getPermissions<IWorkflowsSecurityPermission>(
                WORKFLOWS_PERMISSION
            );
        return permissions.some(permission => permission.reassign === true);
    }

    public async getPermissionSet(): Promise<WorkflowsPermissionSet> {
        const [fullAccess, editor, reassign] = await Promise.all([
            this.isFullAccess(),
            this.canEdit(),
            this.canReassign()
        ]);
        return { fullAccess, editor, reassign };
    }
}

export const WorkflowsPermissions = Abstraction.createImplementation({
    implementation: WorkflowsPermissionsImpl,
    dependencies: [IdentityContext]
});
