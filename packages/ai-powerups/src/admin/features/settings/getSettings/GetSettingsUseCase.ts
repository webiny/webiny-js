import { GetSettingsUseCase as UseCaseAbstraction, GetSettingsRepository } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";

class GetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetSettingsRepository.Interface) {}

    async execute(): Promise<IAiPowerUpsSettings> {
        return this.repository.execute();
    }
}

export const GetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [GetSettingsRepository]
});
