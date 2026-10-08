import { Result } from "@webiny/feature/api";
import {
    FrontendGetSettingsUseCase as UseCaseAbstraction,
    FrontendGetSettingsRepository
} from "./abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";

class FrontendGetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: FrontendGetSettingsRepository.Interface
    ) {}

    async execute(): UseCaseAbstraction.Return {
        /*
         * Reading only needs a signed-in user. Content editors need the domain to preview pages
         * and entries, and the domain is not a secret. Changing it still needs the
         * `dev-tools.frontend-settings.*` permission (see FrontendUpdateSettingsUseCase).
         */
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        const { domain } = await this.repository.execute();
        return Result.ok({ domain });
    }
}

export const FrontendGetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: FrontendGetSettingsUseCaseImpl,
    dependencies: [IdentityContext, FrontendGetSettingsRepository]
});
