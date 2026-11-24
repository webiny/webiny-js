import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { WEBSITE_BUILDER_INTEGRATIONS } from "~/constants.js";
import { GetIntegrationsUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetIntegrationsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private permissions: WbPermissions.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async execute(): Promise<Result<Record<string, any>, UseCaseAbstraction.Error>> {
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        /* Integrations hold credentials. The page editor needs them for its integration inputs
           (e.g. ecommerce pickers), so page editors may read them too. */
        const canRead =
            (await this.permissions.canAccess("integrations")) ||
            (await this.permissions.canEdit("page"));
        if (!canRead) {
            return Result.fail(new NotAuthorizedError());
        }

        const result = await this.keyValueStore.get<Record<string, any>>(
            WEBSITE_BUILDER_INTEGRATIONS
        );

        return Result.ok(result.isOk() ? result.value : {});
    }
}

export const GetIntegrationsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetIntegrationsUseCaseImpl,
    dependencies: [IdentityContext, WbPermissions, KeyValueStore]
});
