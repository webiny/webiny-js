import { Result } from "@webiny/feature/api";
import { GetSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { FrontendGetSettingsRepository } from "@webiny/frontend-settings/api/features/getSettings/abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class GetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: FrontendGetSettingsRepository.Interface
    ) {}

    async execute(): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        const settings = await this.repository.execute();
        return Result.ok(settings);
    }
}

export const GetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [WbPermissions, FrontendGetSettingsRepository]
});
