import {
    UpdateSettingsUseCase as UseCaseAbstraction,
    UpdateSettingsRepository
} from "./abstractions/index.js";

class UpdateSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateSettingsRepository.Interface) {}

    async execute(settings: UseCaseAbstraction.Params): Promise<void> {
        await this.repository.execute(settings);
    }
}

export const UpdateSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateSettingsUseCaseImpl,
    dependencies: [UpdateSettingsRepository]
});
