import { Result } from "@webiny/feature/api";
import { UpdateSettingsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateSettings } from "@webiny/api-core/features/settings/UpdateSettings";
import { GetSettingsUseCase } from "../GetSettings/abstractions.js";
import type { FileManagerSettings, UpdateSettingsInput } from "~/domain/settings/types.js";
import { SettingsUpdateError } from "~/domain/settings/errors.js";
import { FILE_MANAGER_GENERAL_SETTINGS } from "~/domain/settings/constants.js";

class UpdateSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private updateSettings: UpdateSettings.Interface,
        private getSettings: GetSettingsUseCase.Interface
    ) {}

    async execute(
        input: UpdateSettingsInput
    ): Promise<Result<FileManagerSettings, UseCaseAbstraction.Error>> {
        // Get existing settings to merge with new data
        const existingResult = await this.getSettings.execute();
        const existing = existingResult.value;

        const result = await this.updateSettings.execute({
            name: FILE_MANAGER_GENERAL_SETTINGS,
            data: {
                ...existing,
                ...input
            }
        });

        if (result.isFail()) {
            return Result.fail(new SettingsUpdateError(result.error));
        }

        return Result.ok(result.value.data as FileManagerSettings);
    }
}

export const UpdateSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateSettingsUseCaseImpl,
    dependencies: [UpdateSettings, GetSettingsUseCase]
});
