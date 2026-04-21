import { GetSettingsUseCase, GetSettingsRepository } from "./abstractions.js";

class GetSettingsUseCaseImpl implements GetSettingsUseCase.Interface {
    constructor(private repository: GetSettingsRepository.Interface) {}

    execute() {
        return this.repository.get();
    }
}

export const GetSettingsUseCaseImplementation = GetSettingsUseCase.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [GetSettingsRepository]
});
