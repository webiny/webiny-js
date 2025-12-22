import { Result } from "@webiny/feature/api";
import { GetSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetSettingsUseCase as BaseGetSettings } from "@webiny/api-core/features/settings/GetSettings";
import type { FileManagerSettings } from "~/domain/settings/types.js";
import {
    FILE_MANAGER_GENERAL_SETTINGS,
    MAX_FILE_SIZE,
    MIN_FILE_SIZE
} from "~/domain/settings/constants.js";
import { ServiceDiscovery } from "@webiny/api";

class GetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private getSettings: BaseGetSettings.Interface) {}

    async execute(): Promise<Result<FileManagerSettings, UseCaseAbstraction.Error>> {
        const result = await this.getSettings.execute(FILE_MANAGER_GENERAL_SETTINGS);

        // TODO: move this to api-core with a proper abstraction
        const manifest = await ServiceDiscovery.load();
        const { domain } = manifest?.api?.cloudfront || {};
        const defaultSettings: FileManagerSettings = {
            uploadMinFileSize: MIN_FILE_SIZE,
            uploadMaxFileSize: MAX_FILE_SIZE,
            srcPrefix: domain ? `${domain}/files/` : ""
        };

        if (result.isFail()) {
            // Return default values
            return Result.ok(defaultSettings);
        }

        const settings = result.value.data as FileManagerSettings;
        /**
         * We need to ensure that all the settings are always returned.
         * If setting is empty (0 or ""), we need to use the default value.
         */
        return Result.ok({
            uploadMinFileSize: settings.uploadMinFileSize || defaultSettings.uploadMinFileSize,
            uploadMaxFileSize: settings.uploadMaxFileSize || defaultSettings.uploadMaxFileSize,
            srcPrefix: settings.srcPrefix || defaultSettings.srcPrefix
        });
    }
}

export const GetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [BaseGetSettings]
});
