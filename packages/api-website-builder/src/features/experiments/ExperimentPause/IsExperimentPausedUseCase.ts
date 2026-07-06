import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { IsExperimentPausedUseCase as UseCaseAbstraction } from "./abstractions/IsExperimentPausedUseCase.js";
import { experimentPauseKey } from "./abstractions/experimentPauseKey.js";

/** Reads the kill-switch flag. Consulted uncached on the serving path so pausing is instant. */
class IsExperimentPausedUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private keyValueStore: KeyValueStore.Interface) {}

    async execute(experimentEntryId: string): UseCaseAbstraction.Return {
        const result = await this.keyValueStore.get<boolean>(experimentPauseKey(experimentEntryId));
        if (result.isFail()) {
            return Result.ok(false);
        }
        return Result.ok(result.value === true);
    }
}

export const IsExperimentPausedUseCase = UseCaseAbstraction.createImplementation({
    implementation: IsExperimentPausedUseCaseImpl,
    dependencies: [KeyValueStore]
});
