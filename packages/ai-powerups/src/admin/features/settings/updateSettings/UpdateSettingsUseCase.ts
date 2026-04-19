import {
    UpdateSettingsUseCase as UseCaseAbstraction,
    UpdateSettingsRepository
} from "./abstractions.js";

class UpdateSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: UpdateSettingsRepository.Interface) {}

    async execute(data: Record<string, any>): Promise<Record<string, any>> {
        return this.repository.execute(data);
    }
}

export const UpdateSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateSettingsUseCaseImpl,
    dependencies: [UpdateSettingsRepository]
});
