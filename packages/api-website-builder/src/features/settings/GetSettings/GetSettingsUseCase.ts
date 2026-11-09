import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { WEBSITE_BUILDER_SETTINGS } from "~/constants.js";
import type { WbSettings } from "./abstractions.js";
import { GetSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async execute(): Promise<Result<WbSettings, UseCaseAbstraction.Error>> {
        if (this.identityContext.getIdentity().isAnonymous()) {
            return Result.fail(new NotAuthorizedError());
        }

        const result = await this.keyValueStore.get<Partial<WbSettings>>(WEBSITE_BUILDER_SETTINGS);
        const previewDomain = result.isOk() ? result.value.previewDomain : undefined;

        // TODO: add a Settings domain model with defaults.
        return Result.ok({ previewDomain: previewDomain ?? "http://localhost:3000" });
    }
}

export const GetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [IdentityContext, KeyValueStore]
});
