import { LogInUseCase } from "~/features/security/LogIn/abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { AssumedRoleContext } from "./abstractions.js";

/**
 * Drops a stored preview that doesn't belong to this login, and logs in again as the user.
 *
 * The login request has to carry the preview header, since that request is what returns the
 * previewed permissions, and it goes out before anyone knows who is signing in. So a preview left
 * behind is caught here, after the fact, in the two ways it can go wrong:
 *
 * - The login fails. A preview that no longer resolves (the role was deleted, or it belongs to
 *   another tenant) grants nothing, and a login with no permissions throws. Without this the user
 *   would be stuck on that error screen, because the selection survives a reload.
 * - It was started by someone else. A session can end without going through log out, so the next
 *   person on the browser would otherwise inherit whatever the last one was previewing.
 */
class LogInUseCaseDecoratorImpl implements LogInUseCase.Interface {
    constructor(
        private assumedRoleContext: AssumedRoleContext.Interface,
        private identityContext: IdentityContext.Interface,
        private decoratee: LogInUseCase.Interface
    ) {}

    async execute(params: LogInUseCase.Params): Promise<void> {
        const assumed = this.assumedRoleContext.get();

        if (!assumed) {
            await this.decoratee.execute(params);
            return;
        }

        try {
            await this.decoratee.execute(params);
        } catch {
            await this.loginWithoutPreview(params);
            return;
        }

        const identity = this.identityContext.getIdentity();
        if (identity.id !== assumed.startedBy) {
            await this.loginWithoutPreview(params);
        }
    }

    private async loginWithoutPreview(params: LogInUseCase.Params): Promise<void> {
        this.assumedRoleContext.set(null);
        await this.decoratee.execute(params);
    }
}

export const LogInUseCaseDecorator = LogInUseCase.createDecorator({
    decorator: LogInUseCaseDecoratorImpl,
    dependencies: [AssumedRoleContext, IdentityContext]
});
