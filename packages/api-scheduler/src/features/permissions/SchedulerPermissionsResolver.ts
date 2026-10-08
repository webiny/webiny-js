import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import {
    SchedulerPermissions,
    SchedulerPermissionsResolver as Abstraction
} from "./abstractions.js";

/**
 * Used when no app claims a namespace. Scheduled actions in such a namespace have no app permissions
 * to check against, so they stay closed to everyone except full-access identities and code that
 * runs with authorization switched off.
 */
class FullAccessOnlyPermissions implements SchedulerPermissions.Interface {
    constructor(private readonly identityContext: IdentityContext.Interface) {}

    canHandle(): boolean {
        return false;
    }

    async canRead(): Promise<boolean> {
        if (!this.identityContext.isAuthorizationEnabled()) {
            return true;
        }
        return this.identityContext.hasFullAccess();
    }

    async onlyOwnRecords(): Promise<boolean> {
        return false;
    }
}

class SchedulerPermissionsResolverImpl implements Abstraction.Interface {
    private readonly fallback: SchedulerPermissions.Interface;

    constructor(
        private readonly handlers: SchedulerPermissions.Interface[],
        identityContext: IdentityContext.Interface
    ) {
        this.fallback = new FullAccessOnlyPermissions(identityContext);
    }

    forNamespace(namespace: string | undefined): SchedulerPermissions.Interface {
        if (!namespace) {
            return this.fallback;
        }
        return this.handlers.find(h => h.canHandle(namespace)) ?? this.fallback;
    }
}

export const SchedulerPermissionsResolver = Abstraction.createImplementation({
    implementation: SchedulerPermissionsResolverImpl,
    dependencies: [[SchedulerPermissions, { multiple: true }], IdentityContext]
});
