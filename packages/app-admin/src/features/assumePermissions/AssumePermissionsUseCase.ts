import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { LogInRepository } from "~/features/security/LogIn/abstractions.js";
import { hasAppPermissions } from "~/features/security/LogIn/hasAppPermissions.js";
import { AssumePermissionsContext } from "./abstractions.js";
import { AssumePermissionsUseCase as Abstraction } from "./abstractions.js";

/**
 * Switches the Admin into (or out of) previewing a role. The permissions themselves come from the
 * API: once the context holds a role, every request carries the assume-permissions header, so the
 * login query returns the identity as that role sees it. Nothing about the permission set is
 * decided on the client.
 *
 * This only records the choice and proves it works. The caller reloads the page afterwards, which
 * is what actually re-renders the Admin as the new role. Swapping the identity in place leaves
 * half the UI stale, because permission checks like `createHasPermission` read the identity during
 * render without observing it, and every list already fetched still holds the previous role's
 * data. The tenant switcher reaches for a full page load for the same reason.
 *
 * The login call here is not redundant with the one the reload performs. It is how a role that
 * grants nothing gets caught BEFORE the reload: the selection is persisted, so reloading into a
 * failed login would strand the user behind an error screen with no way to clear it.
 */
class AssumePermissionsUseCaseImpl implements Abstraction.Interface {
    constructor(
        private assumePermissionsContext: AssumePermissionsContext.Interface,
        private identityContext: IdentityContext.Interface,
        private logInRepository: LogInRepository.Interface
    ) {}

    async execute(
        target: Abstraction.Target | null,
        options: Abstraction.Options = {}
    ): Promise<void> {
        const previous = this.assumePermissionsContext.get();
        const value = this.toStored(target, previous, options);
        this.assumePermissionsContext.set(value);

        try {
            await this.verify(value);
        } catch (error) {
            /*
             * Put the previous selection back. Otherwise the app keeps sending a header it has
             * already failed on, and because the selection is persisted, a reload won't clear it.
             */
            this.assumePermissionsContext.set(previous);
            throw error;
        }
    }

    /*
     * The identity id is the same whether or not a preview is running (only the permissions
     * change), so switching straight from one role to another still records the right person.
     */
    private toStored(
        target: Abstraction.Target | null,
        previous: AssumePermissionsContext.Value | null,
        options: Abstraction.Options
    ): AssumePermissionsContext.Value | null {
        if (!target) {
            return null;
        }

        const identity = this.identityContext.getIdentity();
        const value: AssumePermissionsContext.Value = { ...target, startedBy: identity.id };

        // Switching from one role to the next keeps the place the first preview started from.
        const returnTo = previous?.returnTo ?? options.returnTo;
        if (returnTo) {
            value.returnTo = returnTo;
        }

        return value;
    }

    private async verify(value: AssumePermissionsContext.Value | null): Promise<void> {
        const identity = await this.logInRepository.login();

        if (value && !hasAppPermissions(identity)) {
            throw new Error(`"${value.name}" grants no permissions on this tenant.`);
        }
    }
}

export const AssumePermissionsUseCase = Abstraction.createImplementation({
    implementation: AssumePermissionsUseCaseImpl,
    dependencies: [AssumePermissionsContext, IdentityContext, LogInRepository]
});
