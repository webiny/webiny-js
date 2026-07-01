import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import {
    PauseExperimentUseCase as PauseAbstraction,
    ResumeExperimentUseCase as ResumeAbstraction,
    IsExperimentPausedUseCase as IsPausedAbstraction,
    experimentPauseKey
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { ExperimentNotAuthorizedError } from "~/domain/experiment/errors.js";

/**
 * The kill-switch is a runtime flag, deliberately decoupled from the published content: pausing
 * only ever reverts to serving the already-approved control, so it needs no publish/approval and
 * takes effect immediately.
 */
class PauseExperimentUseCaseImpl implements PauseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async execute(experimentEntryId: string): PauseAbstraction.Return {
        if (!(await this.permissions.canPublish("experiment"))) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }
        await this.keyValueStore.set(experimentPauseKey(experimentEntryId), true);
        return Result.ok(true);
    }
}

class ResumeExperimentUseCaseImpl implements ResumeAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async execute(experimentEntryId: string): ResumeAbstraction.Return {
        if (!(await this.permissions.canPublish("experiment"))) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }
        await this.keyValueStore.delete(experimentPauseKey(experimentEntryId));
        return Result.ok(true);
    }
}

class IsExperimentPausedUseCaseImpl implements IsPausedAbstraction.Interface {
    constructor(private keyValueStore: KeyValueStore.Interface) {}

    async execute(experimentEntryId: string): IsPausedAbstraction.Return {
        const result = await this.keyValueStore.get<boolean>(experimentPauseKey(experimentEntryId));
        if (result.isFail()) {
            return Result.ok(false);
        }
        return Result.ok(result.value === true);
    }
}

export const PauseExperimentUseCase = PauseAbstraction.createImplementation({
    implementation: PauseExperimentUseCaseImpl,
    dependencies: [WbPermissions, KeyValueStore]
});

export const ResumeExperimentUseCase = ResumeAbstraction.createImplementation({
    implementation: ResumeExperimentUseCaseImpl,
    dependencies: [WbPermissions, KeyValueStore]
});

export const IsExperimentPausedUseCase = IsPausedAbstraction.createImplementation({
    implementation: IsExperimentPausedUseCaseImpl,
    dependencies: [KeyValueStore]
});
