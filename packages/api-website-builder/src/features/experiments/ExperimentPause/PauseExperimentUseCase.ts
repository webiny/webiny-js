import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { PauseExperimentUseCase as UseCaseAbstraction } from "./abstractions/PauseExperimentUseCase.js";
import { experimentPauseKey } from "./abstractions/experimentPauseKey.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { ExperimentNotAuthorizedError } from "~/domain/experiment/errors.js";

/**
 * The kill-switch is a runtime flag, deliberately decoupled from the published content: pausing
 * only ever reverts to serving the already-approved control, so it needs no publish/approval and
 * takes effect immediately.
 */
class PauseExperimentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async execute(experimentEntryId: string): UseCaseAbstraction.Return {
        if (!(await this.permissions.canPublish("page"))) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }
        await this.keyValueStore.set(experimentPauseKey(experimentEntryId), true);
        return Result.ok(true);
    }
}

export const PauseExperimentUseCase = UseCaseAbstraction.createImplementation({
    implementation: PauseExperimentUseCaseImpl,
    dependencies: [WbPermissions, KeyValueStore]
});
