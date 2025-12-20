import { Result } from "@webiny/feature/api";
import { GetSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetSettingsUseCase as BaseGetSettings } from "@webiny/api-core/features/settings/GetSettings";
import type { FileManagerSettings } from "~/domain/settings/types.js";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";

class GetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private getSettings: BaseGetSettings.Interface) {}

    async execute(): Promise<Result<FileManagerSettings, UseCaseAbstraction.Error>> {
        const result = await this.getSettings.execute(FILE_MANAGER_GENERAL_SETTINGS);

        if (result.isFail()) {
            // Return default values
            return Result.ok({
                uploadMinFileSize: 0,
                uploadMaxFileSize: 10737418240,
                srcPrefix: ""
            });
        }

        const settings = result.value.data as FileManagerSettings;

        return Result.ok(settings);
    }
}

export const GetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [BaseGetSettings]
});
