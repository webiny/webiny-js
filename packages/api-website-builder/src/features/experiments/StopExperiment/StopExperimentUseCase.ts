import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    StopExperimentUseCase as UseCaseAbstraction,
    StopExperimentRepository
} from "./abstractions.js";
import { ExperimentAfterStopEvent } from "./events.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { GetExperimentByIdUseCase } from "~/features/experiments/GetExperimentById/index.js";
import {
    ExperimentNotAuthorizedError,
    ExperimentValidationError
} from "~/domain/experiment/errors.js";

class StopExperimentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private getExperimentById: GetExperimentByIdUseCase.Interface,
        private repository: StopExperimentRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canPublish("page");
        if (!hasPermission) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }

        const experimentResult = await this.getExperimentById.execute(params.id);
        if (experimentResult.isFail()) {
            return Result.fail(experimentResult.error);
        }

        if (experimentResult.value.status !== "running") {
            return Result.fail(
                new ExperimentValidationError(
                    `Only a running experiment can be stopped (current status: "${experimentResult.value.status}").`
                )
            );
        }

        const result = await this.repository.execute(params.id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new ExperimentAfterStopEvent({ experiment: result.value, reason: "manual" })
        );

        return Result.ok(result.value);
    }
}

export const StopExperimentUseCase = UseCaseAbstraction.createImplementation({
    implementation: StopExperimentUseCaseImpl,
    dependencies: [
        WbPermissions,
        EventPublisher,
        GetExperimentByIdUseCase,
        StopExperimentRepository
    ]
});
