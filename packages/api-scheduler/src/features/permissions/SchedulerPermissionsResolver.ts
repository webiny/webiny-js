import {
    SchedulerPermissions,
    SchedulerPermissionsResolver as Abstraction
} from "./abstractions.js";

class SchedulerPermissionsResolverImpl implements Abstraction.Interface {
    constructor(private readonly handlers: SchedulerPermissions.Interface[]) {}

    forNamespace(namespace: string): SchedulerPermissions.Interface | undefined {
        return this.handlers.find(h => h.canHandle(namespace));
    }
}

export const SchedulerPermissionsResolver = Abstraction.createImplementation({
    implementation: SchedulerPermissionsResolverImpl,
    dependencies: [[SchedulerPermissions, { multiple: true }]]
});
