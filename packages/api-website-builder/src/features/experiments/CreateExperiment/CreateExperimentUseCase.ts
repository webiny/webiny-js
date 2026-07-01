import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import {
    CreateExperimentUseCase as UseCaseAbstraction,
    CreateExperimentRepository
} from "./abstractions.js";
import { ExperimentBeforeCreateEvent, ExperimentAfterCreateEvent } from "./events.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { ExperimentNotAuthorizedError } from "~/domain/experiment/errors.js";

class CreateExperimentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: CreateExperimentRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canCreate("page");
        if (!hasPermission) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }

        await this.eventPublisher.publish(new ExperimentBeforeCreateEvent({ input: params }));

        const result = await this.repository.execute(params);
        if (result.isFail()) {
            return result;
        }

        await this.eventPublisher.publish(
            new ExperimentAfterCreateEvent({ experiment: result.value })
        );

        return Result.ok(result.value);
    }
}

export const CreateExperimentUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateExperimentUseCaseImpl,
    dependencies: [WbPermissions, EventPublisher, CreateExperimentRepository]
});
