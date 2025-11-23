import { Result } from "@webiny/feature/api";
import { GetSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetSettings } from "@webiny/api-core/features/settings/GetSettings";
import type { FileManagerSettings } from "~/domain/settings/types.js";
import { SettingsNotFoundError } from "~/domain/settings/errors.js";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";

class GetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private getSettings: GetSettings.Interface) {}

    async execute(): Promise<Result<FileManagerSettings, UseCaseAbstraction.Error>> {
        const result = await this.getSettings.execute(FILE_MANAGER_GENERAL_SETTINGS);

        if (result.isFail()) {
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
    dependencies: [GetSettings]
});
