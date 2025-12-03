import { createImplementation } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { GetSettings } from "./abstractions.js";
import { SettingsRepository } from "../shared/abstractions.js";
import type { ISettings } from "~/domain/settings/index.js";

class GetSettingsUseCaseImpl implements GetSettings.Interface {
    private repository: SettingsRepository.Interface;

    constructor(repository: SettingsRepository.Interface) {
        this.repository = repository;
    }

    execute(name: string): Promise<Result<ISettings, GetSettings.Error>> {
        return this.repository.get(name);
    }
}

export const GetSettingsUseCase = createImplementation({
    abstraction: GetSettings,
    implementation: GetSettingsUseCaseImpl,
    dependencies: [SettingsRepository]
});
