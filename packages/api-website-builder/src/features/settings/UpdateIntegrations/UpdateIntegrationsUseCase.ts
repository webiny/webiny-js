import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { WEBSITE_BUILDER_INTEGRATIONS } from "~/constants.js";
import { UpdateIntegrationsUseCase as UseCaseAbstraction } from "./abstractions.js";

class UpdateIntegrationsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async execute(data: Record<string, any>): Promise<Result<void, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canAccess("integrations"))) {
            return Result.fail(new NotAuthorizedError());
        }

        return this.keyValueStore.set(WEBSITE_BUILDER_INTEGRATIONS, data);
    }
}

export const UpdateIntegrationsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateIntegrationsUseCaseImpl,
    dependencies: [WbPermissions, KeyValueStore]
});
