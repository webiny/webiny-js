import {
    GetFrontendSettingsUseCase as UseCaseAbstraction,
    GetFrontendSettingsRepository
} from "./abstractions.js";
import type { IFrontendSettings } from "~/shared/types.js";

class GetFrontendSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetFrontendSettingsRepository.Interface) {}

    async execute(): Promise<IFrontendSettings> {
        return this.repository.execute();
    }
}

export const GetFrontendSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetFrontendSettingsUseCaseImpl,
    dependencies: [GetFrontendSettingsRepository]
});
