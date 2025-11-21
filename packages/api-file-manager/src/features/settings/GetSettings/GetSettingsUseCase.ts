import { Result } from "@webiny/feature/api";
import {
    GetSettingsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { GetSettings } from "@webiny/api-core/features/settings/GetSettings";
import type { FileManagerSettings } from "~/domain/settings/types.js";

const SETTINGS_NAME = "file-manager";

class GetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getSettings: GetSettings.Interface
    ) {}

    async execute(): Promise<Result<FileManagerSettings | null, never>> {
        const result = await this.getSettings.execute<FileManagerSettings>({ name: SETTINGS_NAME });

        if (result.isFail()) {
            return Result.ok(null);
        }

        return Result.ok(result.value);
    }
}

export const GetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [GetSettings]
});
