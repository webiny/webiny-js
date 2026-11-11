import { Result } from "@webiny/feature/api";
import {
    GetLayoutSettingsRepository,
    GetLayoutSettingsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { LayoutNotAuthorizedError } from "~/domain/layout/errors.js";

class GetLayoutSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetLayoutSettingsRepository.Interface
    ) {}

    async execute(): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        return this.repository.execute();
    }
}

export const GetLayoutSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLayoutSettingsUseCaseImpl,
    dependencies: [WbPermissions, GetLayoutSettingsRepository]
});
