import { Result } from "@webiny/feature/api";
import {
    ExecuteScheduledActionUseCase as UseCaseAbstraction,
    ExecutionFailedError,
    HandlerNotFoundError
} from "./abstractions.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/abstractions.js";
import {
    type IScheduledAction,
    ScheduledActionHandler,
    ScheduledActionModel
} from "~/shared/abstractions.js";
import { ScheduledActionNotFoundError, ScheduledActionPersistenceError } from "~/domain/errors.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { ScheduledActionIdWithVersion } from "~/domain/ScheduledActionIdWithVersion.js";
import type { GenericRecord } from "@webiny/api/types.js";

/**
 * Executes a scheduled action
 *
 * Flow:
 * 1. Load scheduled action from CMS
 * 2. Find registered handler for namespace + actionType
 * 3. Execute handler
 * 4. Delete schedule entry on success
 * 5. Update entry with error on failure (for debugging/audit)
 */
class ExecuteScheduledActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getScheduledActionUseCase: GetScheduledActionUseCase.Interface,
        private actionHandler: ScheduledActionHandler.Interface,
        private deleteEntryUseCase: DeleteEntryUseCase.Interface,
        private updateEntryUseCase: UpdateEntryUseCase.Interface,
        private model: ScheduledActionModel.Interface
    ) {}

    async execute<T extends GenericRecord>(
        id: string
    ): Promise<Result<void, UseCaseAbstraction.Error>> {
        // Load scheduled action
        const getResult = await this.getScheduledActionUseCase.execute<T>(id);

        if (getResult.isFail()) {
            const error = getResult.error;

            if (error.code === "Scheduler/ScheduledAction/NotFound") {
                return Result.fail(new ScheduledActionNotFoundError(id));
            }

            return Result.fail(error);
        }

        const scheduledAction = getResult.value;
        const scheduleId = ScheduledActionIdWithVersion.from(id);

        // Check if the handler can handle this action
        if (!this.actionHandler.canHandle(scheduledAction.namespace, scheduledAction.actionType)) {
            const error = new HandlerNotFoundError(
                scheduledAction.namespace,
                scheduledAction.actionType
            );

            // Update entry with error for debugging
            await this.updateEntryUseCase.execute<IScheduledAction<T>>(this.model, scheduleId, {
                values: {
                    error: error.message
                }
            });

            return Result.fail(error);
        }

        // Execute handler
        try {
            await this.actionHandler.handle(scheduledAction);

            // Delete schedule entry on success
            const deleteResult = await this.deleteEntryUseCase.execute(this.model, scheduleId, {
                force: true,
                permanently: true
            });

            if (deleteResult.isFail()) {
                return Result.fail(
                    new ScheduledActionPersistenceError(new Error(deleteResult.error.message))
                );
            }

            return Result.ok();
        } catch (error) {
            const executionError = new ExecutionFailedError(
                `Failed to execute scheduled action: ${(error as Error).message}`,
                error as Error
            );

            // Update entry with error for debugging
            await this.updateEntryUseCase.execute<IScheduledAction<T>>(this.model, scheduleId, {
                values: {
                    error: executionError.message
                }
            });

            return Result.fail(executionError);
        }
    }
}

export const ExecuteScheduledActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: ExecuteScheduledActionUseCaseImpl,
    dependencies: [
        GetScheduledActionUseCase,
        ScheduledActionHandler,
        DeleteEntryUseCase,
        UpdateEntryUseCase,
        ScheduledActionModel
    ]
});
