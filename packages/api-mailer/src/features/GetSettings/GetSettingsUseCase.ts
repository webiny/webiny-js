import { Result } from "@webiny/feature/api";
import { GetSettings, GetSettingsRepository } from "./abstractions.js";
import type { TransportSettings } from "~/types.js";

class GetSettingsUseCaseImpl implements GetSettings.Interface {
    constructor(private repository: GetSettingsRepository.Interface) {}

    execute(): Promise<Result<TransportSettings | null>> {
        return this.repository.get();
    }
}

export const GetSettingsUseCaseImplementation = GetSettings.createImplementation({
    implementation: GetSettingsUseCaseImpl,
    dependencies: [GetSettingsRepository]
});
