import { Result } from "@webiny/feature/api";
import { DeleteModelUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteModelRepository } from "./abstractions.js";
import { EventPublisher } from "@webiny/api-core/features/EventPublisher";
import { ModelBeforeDeleteEvent } from "./events.js";
import { ModelAfterDeleteEvent } from "./events.js";
import { ModelDeleteErrorEvent } from "./events.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import { ModelNotAuthorizedError } from "~/domain/contentModel/errors.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";

/**
 * DeleteModelUseCase - Core model deletion orchestration.
 *
 * Responsibilities:
 * - Fetch model
 * - Access control checks
 * - Publish before event
 * - Delegate to repository for deletion
 * - Publish after event or error event
 *
 * Note: Validation (e.g., checking for entries, plugin models) should be done in event handlers
 */
class DeleteModelUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private eventPublisher: EventPublisher.Interface,
        private repository: DeleteModelRepository.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async execute(modelId: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        // Initial access control check
        const canAccess = await this.accessControl.canAccessModel({ rwd: "d" });
        if (!canAccess) {
            return Result.fail(new ModelNotAuthorizedError());
        }

        // Get the model (with access control check)
        const getResult = await this.getModelUseCase.execute(modelId);
        if (getResult.isFail()) {
            return Result.fail(getResult.error);
        }

        const model = getResult.value;

        // Access control check on the specific model
        const canAccessModel = await this.accessControl.canAccessModel({ model, rwd: "d" });
        if (!canAccessModel) {
            return Result.fail(ModelNotAuthorizedError.fromModel(model));
        }

        // Publish before event
        await this.eventPublisher.publish(new ModelBeforeDeleteEvent({ model }));

        // Delete via repository
        const result = await this.repository.execute(model);

        if (result.isFail()) {
            // Publish error event
            await this.eventPublisher.publish(
                new ModelDeleteErrorEvent({
                    model,
                    error: result.error
                })
            );
            return Result.fail(result.error);
        }

        // Publish after event
        await this.eventPublisher.publish(new ModelAfterDeleteEvent({ model }));

        return Result.ok();
    }
}

export const DeleteModelUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteModelUseCaseImpl,
    dependencies: [GetModelUseCase, EventPublisher, DeleteModelRepository, AccessControl]
});
