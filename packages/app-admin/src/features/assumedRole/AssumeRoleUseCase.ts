import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { LogInRepository } from "~/features/security/LogIn/abstractions.js";
import { AssumedRoleContext } from "./abstractions.js";
import { AssumeRoleUseCase as Abstraction } from "./abstractions.js";
import type { Identity } from "~/domain/Identity.js";

/*
 * `aacl` is granted to every identity that can reach the Admin, so it says nothing about whether a
 * role is usable. Mirrors the same check in LogInUseCase.
 */
function hasUsablePermissions(identity: Identity): boolean {
    const permissions = identity.getPermissions();
    const appPermissions = permissions.filter(permission => permission.name !== "aacl");

    return appPermissions.length > 0;
}

/**
 * Switches the Admin into (or out of) previewing a role. The permissions themselves come from the
 * API: once the context holds a role, every request carries the assume-role header, so re-running
 * the login query returns the identity as that role sees it. Nothing about the permission set is
 * decided on the client.
 */
class AssumeRoleUseCaseImpl implements Abstraction.Interface {
    constructor(
        private assumedRoleContext: AssumedRoleContext.Interface,
        private identityContext: IdentityContext.Interface,
        private logInRepository: LogInRepository.Interface
    ) {}

    async execute(value: AssumedRoleContext.Value | null): Promise<void> {
        const previous = this.assumedRoleContext.get();
        this.assumedRoleContext.set(value);

        try {
            await this.reloadIdentity(value);
        } catch (error) {
            /*
             * Put the previous selection back and reload the identity that belongs to it.
             * Otherwise the app keeps sending a header it has already failed on, and because the
             * selection is persisted, a reload won't clear it either.
             */
            this.assumedRoleContext.set(previous);

            try {
                await this.reloadIdentity(previous);
            } catch {
                // Swallowed on purpose: the original failure is the one worth reporting.
            }

            throw error;
        }
    }

    private async reloadIdentity(value: AssumedRoleContext.Value | null): Promise<void> {
        const identity = await this.logInRepository.login();

        if (value && !hasUsablePermissions(identity)) {
            throw new Error(`"${value.name}" grants no permissions on this tenant.`);
        }

        this.identityContext.setIdentity(identity);
    }
}

export const AssumeRoleUseCase = Abstraction.createImplementation({
    implementation: AssumeRoleUseCaseImpl,
    dependencies: [AssumedRoleContext, IdentityContext, LogInRepository]
});
