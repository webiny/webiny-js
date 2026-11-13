import { SchedulerPermissions as SchedulerPermissionsAbstraction } from "~/features/permissions/abstractions.js";

/**
 * Allows everything in every namespace. Without it, a namespace has no permissions and all access is denied.
 */
class SchedulerPermissionsImpl implements SchedulerPermissionsAbstraction.Interface {
    public canHandle(): boolean {
        return true;
    }

    public async canRead(): Promise<boolean> {
        return true;
    }

    public async onlyOwnRecords(): Promise<boolean> {
        return false;
    }
}

export const SchedulerPermissions = SchedulerPermissionsAbstraction.createImplementation({
    implementation: SchedulerPermissionsImpl,
    dependencies: []
});
