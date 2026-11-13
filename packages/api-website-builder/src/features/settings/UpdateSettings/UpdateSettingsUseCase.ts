import { Result } from "@webiny/feature/api";
import { NotAuthorizedError } from "@webiny/api-core/features/security/shared/errors.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { WEBSITE_BUILDER_SETTINGS } from "~/constants.js";
import type { WbSettings } from "../GetSettings/abstractions.js";
import { UpdateSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";

class UpdateSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async execute(data: WbSettings): Promise<Result<void, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canAccess("settings"))) {
            return Result.fail(new NotAuthorizedError());
        }

        return this.keyValueStore.set(WEBSITE_BUILDER_SETTINGS, data);
    }
}

export const UpdateSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateSettingsUseCaseImpl,
    dependencies: [WbPermissions, KeyValueStore]
});
