import { Result } from "@webiny/feature/api";
import { InitializeModelUseCase as UseCaseAbstraction } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { ModelInitializeEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { ModelNotAuthorizedError } from "~/domain/contentModel/errors.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";

/**
 * InitializeModelUseCase - Initialize model with data.
 *
 * Responsibilities:
 * - Fetch model
 * - Access control checks (using write permission)
 * - Publish initialize event
 * - Event handlers can initialize model data (e.g., create default entries)
 *
 * Note: This is primarily an event dispatch mechanism for plugins
 */
class InitializeModelUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async execute(
        modelId: string,
        data?: Record<string, any>
    ): Promise<Result<void, UseCaseAbstraction.Error>> {
        // Get the model (with access control check)
        const getResult = await this.getModelUseCase.execute(modelId);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const model = getResult.value;

        // Access control check (using write permission)
        const canAccessModel = await this.accessControl.canAccessModel({ model, rwd: "w" });
        if (!canAccessModel) {
            return Result.fail(ModelNotAuthorizedError.fromModel(model));
        }

        // Publish initialize event for plugins to handle
        await this.eventPublisher.publish(new ModelInitializeEvent({ model, data }));

        return Result.ok();
    }
}

export const InitializeModelUseCase = UseCaseAbstraction.createImplementation({
    implementation: InitializeModelUseCaseImpl,
    dependencies: [GetModelUseCase, EventPublisher, AccessControl]
});
