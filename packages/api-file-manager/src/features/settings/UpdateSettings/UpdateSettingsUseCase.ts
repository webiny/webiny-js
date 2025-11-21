import { Result } from "@webiny/feature/api";
import {
    UpdateSettingsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { UpdateSettings } from "@webiny/api-core/features/settings/UpdateSettings";
import { GetSettingsUseCase } from "../GetSettings/abstractions.js";
import type { FileManagerSettings, UpdateSettingsInput } from "~/domain/settings/types.js";
import { SettingsUpdateError } from "~/domain/settings/errors.js";

const SETTINGS_NAME = "file-manager";

class UpdateSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private updateSettings: UpdateSettings.Interface,
        private getSettings: GetSettingsUseCase.Interface
    ) {}

    async execute(input: UpdateSettingsInput): Promise<Result<FileManagerSettings, UseCaseAbstraction.Error>> {
        try {
            // Get existing settings to merge with new data
            const existingResult = await this.getSettings.execute();
            const existing = existingResult.value;

            const result = await this.updateSettings.execute<FileManagerSettings>({
                name: SETTINGS_NAME,
                data: {
                    ...existing,
                    ...input
                }
            });

            if (result.isFail()) {
                return Result.fail(new SettingsUpdateError(result.error));
            }

            return Result.ok(result.value);
        } catch (error) {
            return Result.fail(new SettingsUpdateError(error as Error));
        }
    }
}

export const UpdateSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateSettingsUseCaseImpl,
    dependencies: [UpdateSettings, GetSettingsUseCase]
});
