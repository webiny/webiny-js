import { Result } from "@webiny/feature/api";
import {
    FrontendGetSettingsUseCase as UseCaseAbstraction,
    FrontendGetSettingsRepository
} from "./abstractions.js";
import { StarterKitsProvider } from "~/api/features/starterKits/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";

class FrontendGetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: FrontendGetSettingsRepository.Interface,
        private starterKitsProvider: StarterKitsProvider.Interface
    ) {}

    async execute(): UseCaseAbstraction.Return {
        /*
         * Reading the domain only needs a signed-in user. Content editors need it to preview
         * pages and entries, and it is not a secret. Changing it still needs the
         * `dev-tools.frontend-settings.*` permission (see FrontendUpdateSettingsUseCase).
         */
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        const { domain } = await this.repository.execute();

        /*
         * Starter kit configs contain the frontend integration API key token, so only users who
         * can configure the frontend get them.
         */
        const permission = await this.identityContext.getPermission(
            "dev-tools.frontend-settings.*"
        );
        const starterKits = permission ? await this.starterKitsProvider.execute() : [];

        return Result.ok({ domain, starterKits });
    }
}

export const FrontendGetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: FrontendGetSettingsUseCaseImpl,
    dependencies: [IdentityContext, FrontendGetSettingsRepository, StarterKitsProvider]
});
