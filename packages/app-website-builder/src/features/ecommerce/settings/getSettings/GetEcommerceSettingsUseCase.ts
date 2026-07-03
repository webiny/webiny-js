import {
    GetEcommerceSettingsUseCase as UseCaseAbstraction,
    GetEcommerceSettingsRepository
} from "./abstractions/index.js";

class GetEcommerceSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetEcommerceSettingsRepository.Interface) {}

    async execute(): Promise<UseCaseAbstraction.Result> {
        const result = await this.repository.execute();
        return result;
    }
}

export const GetEcommerceSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetEcommerceSettingsUseCaseImpl,
    dependencies: [GetEcommerceSettingsRepository]
});
