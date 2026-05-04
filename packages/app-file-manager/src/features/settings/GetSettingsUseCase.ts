import type { FmSettings } from "../shared/types.js";
import {
    GetSettingsUseCase as UseCaseAbstraction,
    GetSettingsRepository
} from "./abstractions.js";

class GetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetSettingsRepository.Interface) {}

    async execute(): Promise<FmSettings> {
        return this.repository.execute();
    }
}

export const GetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [GetSettingsRepository]
});
