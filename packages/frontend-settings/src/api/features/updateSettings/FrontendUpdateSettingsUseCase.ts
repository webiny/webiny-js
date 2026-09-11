import { Result } from "@webiny/feature/api";
import {
    FrontendUpdateSettingsUseCase as UseCaseAbstraction,
    FrontendUpdateSettingsRepository
} from "./abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import type { IFrontendSettings } from "~/shared/types.js";

class FrontendUpdateSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: FrontendUpdateSettingsRepository.Interface
    ) {}

    async execute(data: IFrontendSettings): UseCaseAbstraction.Return {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        if (!this.identityContext.getPermission("dev-tools.frontend-settings.*")) {
            return Result.fail(new NotAuthorizedError());
        }

        const success = await this.repository.execute(data);
        return Result.ok(success);
    }
}

export const FrontendUpdateSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: FrontendUpdateSettingsUseCaseImpl,
    dependencies: [IdentityContext, FrontendUpdateSettingsRepository]
});
