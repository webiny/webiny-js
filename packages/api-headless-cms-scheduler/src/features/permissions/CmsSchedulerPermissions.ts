import { SchedulerPermissions } from "@webiny/api-scheduler/features/permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";

class CmsSchedulerPermissionsImpl implements SchedulerPermissions.Interface {
    constructor(private identityContext: IdentityContext.Interface) {}

    async canRead(): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return true;
        }
        const permissions = await this.identityContext.getPermissions("cms.contentEntry");
        return permissions.length > 0;
    }

    async onlyOwnRecords(): Promise<boolean> {
        if (await this.identityContext.hasFullAccess()) {
            return false;
        }
        const permissions = await this.identityContext.getPermissions("cms.contentEntry");
        if (!permissions.length) {
            return false;
        }
        return !permissions.some((p: any) => !p.own);
    }
}

export const CmsSchedulerPermissions = SchedulerPermissions.createImplementation({
    implementation: CmsSchedulerPermissionsImpl,
    dependencies: [IdentityContext]
});
