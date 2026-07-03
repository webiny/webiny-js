import {
    GetSettingsUseCase as UseCaseAbstraction,
    GetSettingsRepository
} from "./abstractions/index.js";

class GetSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetSettingsRepository.Interface) {}

    async execute(): Promise<UseCaseAbstraction.Result> {
        const result = await this.repository.execute();
        return result;
    }
}

export const GetSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [GetSettingsRepository]
});
