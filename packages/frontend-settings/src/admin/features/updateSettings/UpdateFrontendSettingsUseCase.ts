import {
    UpdateFrontendSettingsUseCase as UseCaseAbstraction,
    UpdateFrontendSettingsRepository,
    type FrontendSettingsInput
} from "./abstractions.js";

class UpdateFrontendSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateFrontendSettingsRepository.Interface) {}

    async execute(data: FrontendSettingsInput): Promise<boolean> {
        return this.repository.execute(data);
    }
}

export const UpdateFrontendSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateFrontendSettingsUseCaseImpl,
    dependencies: [UpdateFrontendSettingsRepository]
});
