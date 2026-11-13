import {
    SchedulerPermissions,
    SchedulerPermissionsResolver as Abstraction
} from "./abstractions.js";

/**
 * Used for a namespace no `SchedulerPermissions` implementation handles: nobody is authorized.
 */
const denyAllPermissions: SchedulerPermissions.Interface = {
    canHandle: () => true,
    canRead: async () => false,
    onlyOwnRecords: async () => true
};

class SchedulerPermissionsResolverImpl implements Abstraction.Interface {
    constructor(private readonly handlers: SchedulerPermissions.Interface[]) {}

    forNamespace(namespace: string): SchedulerPermissions.Interface {
        return this.handlers.find(h => h.canHandle(namespace)) ?? denyAllPermissions;
    }
}

export const SchedulerPermissionsResolver = Abstraction.createImplementation({
    implementation: SchedulerPermissionsResolverImpl,
    dependencies: [[SchedulerPermissions, { multiple: true }]]
});
