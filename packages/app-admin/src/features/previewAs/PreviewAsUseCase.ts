import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { LogInRepository } from "~/features/security/LogIn/abstractions.js";
import { PreviewContext } from "./abstractions.js";
import { PreviewAsUseCase as Abstraction } from "./abstractions.js";
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
 * API: once the context holds a role, every request carries the preview-as header, so the login
 * query returns the identity as that role sees it. Nothing about the permission set is decided on
 * the client.
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
class PreviewAsUseCaseImpl implements Abstraction.Interface {
    constructor(
        private previewContext: PreviewContext.Interface,
        private identityContext: IdentityContext.Interface,
        private logInRepository: LogInRepository.Interface
    ) {}

    async execute(target: Abstraction.Target | null): Promise<void> {
        const previous = this.previewContext.get();
        const value = this.toStored(target);
        this.previewContext.set(value);

        try {
            await this.verify(value);
        } catch (error) {
            /*
             * Put the previous selection back. Otherwise the app keeps sending a header it has
             * already failed on, and because the selection is persisted, a reload won't clear it.
             */
            this.previewContext.set(previous);
            throw error;
        }
    }

    /*
     * The identity id is the same whether or not a preview is running (only the permissions
     * change), so switching straight from one role to another still records the right person.
     */
    private toStored(target: Abstraction.Target | null): PreviewContext.Value | null {
        if (!target) {
            return null;
        }

        const identity = this.identityContext.getIdentity();

        return { ...target, startedBy: identity.id };
    }

    private async verify(value: PreviewContext.Value | null): Promise<void> {
        const identity = await this.logInRepository.login();

        if (value && !hasUsablePermissions(identity)) {
            throw new Error(`"${value.name}" grants no permissions on this tenant.`);
        }
    }
}

export const PreviewAsUseCase = Abstraction.createImplementation({
    implementation: PreviewAsUseCaseImpl,
    dependencies: [PreviewContext, IdentityContext, LogInRepository]
});
