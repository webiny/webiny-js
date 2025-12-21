import { Result } from "@webiny/feature/api";
import { GetSettingsUseCase, GetSettingsRepository } from "./abstractions.js";
import type { TransportSettings } from "~/types.js";

class GetSettingsUseCaseImpl implements GetSettingsUseCase.Interface {
    constructor(private repository: GetSettingsRepository.Interface) {}

    execute(): Promise<Result<TransportSettings | null>> {
        return this.repository.get();
    }
}

export const GetSettingsUseCaseImplementation = GetSettingsUseCase.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [GetSettingsRepository]
});
