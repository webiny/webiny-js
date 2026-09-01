import {
    UpdateEcommerceSettingsUseCase as UseCaseAbstraction,
    UpdateEcommerceSettingsRepository
} from "./abstractions/index.js";

class UpdateEcommerceSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateEcommerceSettingsRepository.Interface) {}

    async execute(settings: UseCaseAbstraction.Params): Promise<void> {
        await this.repository.execute(settings);
    }
}

export const UpdateEcommerceSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateEcommerceSettingsUseCaseImpl,
    dependencies: [UpdateEcommerceSettingsRepository]
});
