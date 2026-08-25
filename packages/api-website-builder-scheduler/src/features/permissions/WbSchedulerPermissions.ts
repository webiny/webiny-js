import { SchedulerPermissions } from "@webiny/api-scheduler/features/permissions/abstractions.js";
import { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";

class WbSchedulerPermissionsImpl implements SchedulerPermissions.Interface {
    constructor(private permissions: WbPermissions.Interface) {}

    async canRead(): Promise<boolean> {
        return this.permissions.canPublish("page");
    }

    async onlyOwnRecords(): Promise<boolean> {
        return this.permissions.onlyOwnRecords("page");
    }
}

export const WbSchedulerPermissions = SchedulerPermissions.createImplementation({
    implementation: WbSchedulerPermissionsImpl,
    dependencies: [WbPermissions]
});
