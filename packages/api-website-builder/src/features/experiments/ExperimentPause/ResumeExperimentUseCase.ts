import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { ResumeExperimentUseCase as UseCaseAbstraction } from "./abstractions/ResumeExperimentUseCase.js";
import { experimentPauseKey } from "./abstractions/experimentPauseKey.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { ExperimentNotAuthorizedError } from "~/domain/experiment/errors.js";

/** Clears the kill-switch flag, so serving resumes bucketing visitors into the experiment. */
class ResumeExperimentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private keyValueStore: KeyValueStore.Interface
    ) {}

    async execute(experimentEntryId: string): UseCaseAbstraction.Return {
        if (!(await this.permissions.canPublish("page"))) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }
        await this.keyValueStore.delete(experimentPauseKey(experimentEntryId));
        return Result.ok(true);
    }
}

export const ResumeExperimentUseCase = UseCaseAbstraction.createImplementation({
    implementation: ResumeExperimentUseCaseImpl,
    dependencies: [WbPermissions, KeyValueStore]
});
