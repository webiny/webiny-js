import { Result } from "@webiny/feature/api";
import {
    GetSettingsUseCase,
    GetSettingsRepository,
    type ISettingsWithSource
} from "./abstractions.js";

class GetSettingsUseCaseImpl implements GetSettingsUseCase.Interface {
    constructor(private repository: GetSettingsRepository.Interface) {}

    execute(transportName: string): Promise<Result<ISettingsWithSource>> {
        return this.repository.get(transportName);
    }
}

export const GetSettingsUseCaseImplementation = GetSettingsUseCase.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [GetSettingsRepository]
});
