import { CanAccessCurrentTenantUseCase as UseCaseAbstraction } from "./abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/index.js";
import { AuthorizationContext } from "~/features/security/authorization/AuthorizationContext/index.js";

class CanAccessCurrentTenantUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private authorizationContext: AuthorizationContext.Interface
    ) {}

    async execute(): Promise<boolean> {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return false;
        }

        /*
         * Loaded through AuthorizationContext, not IdentityContext.listPermissions(): with AACL enabled
         * that list always carries an extra `aacl` entry, so it is never empty and the check would
         * always pass.
         */
        const permissions = await this.authorizationContext.loadPermissions(identity);
        return permissions.length > 0;
    }
}

export const CanAccessCurrentTenantUseCase = UseCaseAbstraction.createImplementation({
    implementation: CanAccessCurrentTenantUseCaseImpl,
    dependencies: [IdentityContext, AuthorizationContext]
});
