import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WEBSITE_BUILDER_INTEGRATIONS } from "~/constants.js";
import { UpdateIntegrationsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { canManageIntegrations } from "../canManageIntegrations.js";

class UpdateIntegrationsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async execute(data: Record<string, any>): Promise<Result<void, UseCaseAbstraction.Error>> {
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        if (!(await canManageIntegrations(this.identityContext))) {
            return Result.fail(new NotAuthorizedError());
        }

        return this.keyValueStore.set(WEBSITE_BUILDER_INTEGRATIONS, data);
    }
}

export const UpdateIntegrationsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateIntegrationsUseCaseImpl,
    dependencies: [IdentityContext, KeyValueStore]
});
