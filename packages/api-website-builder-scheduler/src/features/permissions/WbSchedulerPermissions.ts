import { SchedulerPermissions } from "@webiny/api-scheduler/features/permissions/abstractions.js";
import { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";
import { SCHEDULED_ACTION_TYPE_PAGE, SCHEDULED_ACTION_TYPE_REDIRECT } from "~/constants.js";
import { createNamespace } from "~/utils/namespace.js";

/**
 * Scheduled page actions use page permissions: reading them requires page publishing.
 */
class WbPageSchedulerPermissionsImpl implements SchedulerPermissions.Interface {
    constructor(private permissions: WbPermissions.Interface) {}

    canHandle(namespace: string): boolean {
        return namespace === createNamespace(SCHEDULED_ACTION_TYPE_PAGE);
    }

    async canRead(): Promise<boolean> {
        return this.permissions.canPublish("page");
    }

    async onlyOwnRecords(): Promise<boolean> {
        return this.permissions.onlyOwnRecords("page");
    }
}

/**
 * Scheduled redirect actions use redirect permissions.
 */
class WbRedirectSchedulerPermissionsImpl implements SchedulerPermissions.Interface {
    constructor(private permissions: WbPermissions.Interface) {}

    canHandle(namespace: string): boolean {
        return namespace === createNamespace(SCHEDULED_ACTION_TYPE_REDIRECT);
    }

    async canRead(): Promise<boolean> {
        return this.permissions.canRead("redirect");
    }

    async onlyOwnRecords(): Promise<boolean> {
        return this.permissions.onlyOwnRecords("redirect");
    }
}

export const WbPageSchedulerPermissions = SchedulerPermissions.createImplementation({
    implementation: WbPageSchedulerPermissionsImpl,
    dependencies: [WbPermissions]
});

export const WbRedirectSchedulerPermissions = SchedulerPermissions.createImplementation({
    implementation: WbRedirectSchedulerPermissionsImpl,
    dependencies: [WbPermissions]
});
