import { Result } from "@webiny/feature/api";
import { FrontendUpdateSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FrontendUpdateSettingsRepository } from "./abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FrontendPermissions } from "~/api/features/permissions/abstractions.js";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { InvalidFrontendDomainError } from "~/api/domain/errors.js";
import { isValidFrontendDomain } from "~/shared/isValidFrontendDomain.js";
import type { IFrontendSettings } from "~/shared/types.js";

class FrontendUpdateSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private permissions: FrontendPermissions.Interface,
        private repository: FrontendUpdateSettingsRepository.Interface
    ) {}

    async execute(data: IFrontendSettings): UseCaseAbstraction.Return {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        if (!(await this.permissions.canAccess("frontend-settings"))) {
            return Result.fail(new NotAuthorizedError());
        }

        if (!isValidFrontendDomain(data.domain)) {
            return Result.fail(new InvalidFrontendDomainError(data.domain));
        }

        const success = await this.repository.execute(data);
        return Result.ok(success);
    }
}

export const FrontendUpdateSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: FrontendUpdateSettingsUseCaseImpl,
    dependencies: [IdentityContext, FrontendPermissions, FrontendUpdateSettingsRepository]
});
