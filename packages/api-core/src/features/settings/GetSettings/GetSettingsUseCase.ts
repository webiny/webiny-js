import { Result } from "@webiny/feature/api";
import { GetSettingsUseCase as UseCase } from "./abstractions.js";
import { SettingsRepository } from "../shared/abstractions.js";
import type { ISettings } from "~/domain/settings/index.js";

class GetSettingsUseCaseImpl implements UseCase.Interface {
    private repository: SettingsRepository.Interface;

    constructor(repository: SettingsRepository.Interface) {
        this.repository = repository;
    }

    execute(name: string): Promise<Result<ISettings, UseCase.Error>> {
        return this.repository.get(name);
    }
}

export const GetSettingsUseCase = UseCase.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [SettingsRepository]
});
