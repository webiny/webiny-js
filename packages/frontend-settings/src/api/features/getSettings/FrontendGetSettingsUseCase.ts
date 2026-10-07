import { Result } from "@webiny/feature/api";
import { FrontendGetSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FrontendGetSettingsRepository } from "./abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { FrontendPermissions } from "~/api/features/permissions/abstractions.js";
import { StarterKitsProvider } from "~/api/features/starterKits/abstractions.js";
import type { IStarterKit } from "~/shared/types.js";

class FrontendGetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private permissions: FrontendPermissions.Interface,
        private repository: FrontendGetSettingsRepository.Interface,
        private starterKitsProvider: StarterKitsProvider.Interface
    ) {}

    async execute(): UseCaseAbstraction.Return {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        // Every Admin user can read the domain, because content previews are built from it.
        const { domain } = await this.repository.execute();
        const starterKits = await this.getStarterKits();

        return Result.ok({ domain, starterKits });
    }

    /**
     * Starter kit configs include API key tokens, so only users who can manage frontend settings
     * get them.
     */
    private async getStarterKits(): Promise<IStarterKit[]> {
        if (!(await this.permissions.canAccess("frontend-settings"))) {
            return [];
        }

        return this.starterKitsProvider.execute();
    }
}

export const FrontendGetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: FrontendGetSettingsUseCaseImpl,
    dependencies: [
        IdentityContext,
        FrontendPermissions,
        FrontendGetSettingsRepository,
        StarterKitsProvider
    ]
});
