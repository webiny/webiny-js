import { Result } from "@webiny/feature/api";
import { GetSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import type { FileManagerSettings } from "~/domain/settings/types.js";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

class GetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private keyValueStore: KeyValueStore.Interface) {}

    async execute(): Promise<Result<FileManagerSettings, UseCaseAbstraction.Error>> {
        const result = await this.keyValueStore.get<FileManagerSettings>(
            FILE_MANAGER_GENERAL_SETTINGS
        );

        if (result.isFail()) {
            // Return default values
            return Result.ok({
                uploadMinFileSize: 0,
                uploadMaxFileSize: 10737418240,
                srcPrefix: ""
            });
        }

        const settings = result.value;

        return Result.ok(settings);
    }
}

export const GetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [KeyValueStore]
});
