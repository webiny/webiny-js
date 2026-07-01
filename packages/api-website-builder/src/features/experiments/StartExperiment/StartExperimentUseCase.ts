import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    StartExperimentUseCase as UseCaseAbstraction,
    StartExperimentRepository
} from "./abstractions.js";
import { ExperimentAfterStartEvent } from "./events.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { GetExperimentByIdUseCase } from "~/features/experiments/GetExperimentById/index.js";
import { GetActiveExperimentForRevisionUseCase } from "~/features/experiments/GetActiveExperimentForRevision/index.js";
import {
    ExperimentAlreadyActiveError,
    ExperimentNotAuthorizedError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";

class StartExperimentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getExperimentById: GetExperimentByIdUseCase.Interface,
        private getActiveExperiment: GetActiveExperimentForRevisionUseCase.Interface,
        private repository: StartExperimentRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canPublish("experiment");
        if (!hasPermission) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }

        const experimentResult = await this.getExperimentById.execute(params.id);
        if (experimentResult.isFail()) {
            return Result.fail(experimentResult.error);
        }

        const experiment = experimentResult.value;

        // A draft experiment can be started; a stopped one can be re-activated.
        if (experiment.status !== "draft" && experiment.status !== "stopped") {
            return Result.fail(
                new ExperimentValidationError(
                    `Only a draft or stopped experiment can be started (current status: "${experiment.status}").`
                )
            );
        }

        // v1: one active experiment per revision.
        const activeResult = await this.getActiveExperiment.execute(experiment.baselineRevisionId);
        if (activeResult.isFail()) {
            return Result.fail(activeResult.error);
        }
        if (activeResult.value && activeResult.value.entryId !== experiment.entryId) {
            return Result.fail(new ExperimentAlreadyActiveError(experiment.baselineRevisionId));
        }

        const result = await this.repository.execute(params.id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new ExperimentAfterStartEvent({ experiment: result.value })
        );

        return Result.ok(result.value);
    }
}

export const StartExperimentUseCase = UseCaseAbstraction.createImplementation({
    implementation: StartExperimentUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetExperimentByIdUseCase,
        GetActiveExperimentForRevisionUseCase,
        StartExperimentRepository
    ]
});
