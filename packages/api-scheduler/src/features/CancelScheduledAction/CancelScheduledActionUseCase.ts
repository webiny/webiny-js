import { Result } from "@webiny/feature/api";
import { CancelScheduledActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/abstractions.js";
import { ScheduledActionModel, SchedulerService } from "~/shared/abstractions.js";
import {
    ScheduledActionNotFoundError,
    ScheduledActionPersistenceError,
    SchedulerServiceError
} from "~/domain/errors.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";

/**
 * Cancels a scheduled action
 *
 * Flow:
 * 1. Check if schedule exists
 * 2. Delete EventBridge schedule
 * 3. Delete CMS entry
 * 4. If EventBridge delete fails, continue anyway (schedule might already be executed/deleted)
 */
class CancelScheduledActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getScheduledActionUseCase: GetScheduledActionUseCase.Interface,
        private schedulerService: SchedulerService.Interface,
        private deleteEntryUseCase: DeleteEntryUseCase.Interface,
        private model: ScheduledActionModel.Interface
    ) {}

    async execute(scheduleId: string): Promise<Result<void, UseCaseAbstraction.Error>> {
        // Check if schedule exists
        const getResult = await this.getScheduledActionUseCase.execute(scheduleId);

        if (getResult.isFail()) {
            const error = getResult.error;

            if (error.code === "Scheduler/ScheduledAction/NotFound") {
                return Result.fail(new ScheduledActionNotFoundError(scheduleId));
            }

            return Result.fail(error);
        }

        // Delete EventBridge schedule
        // Note: We continue even if this fails, as the schedule might already be executed/deleted
        try {
            await this.schedulerService.delete(scheduleId);
        } catch (error) {
            console.warn(
                `Failed to delete EventBridge schedule: ${scheduleId}. Continuing with CMS entry deletion.`,
                error
            );
        }

        // Delete CMS entry
        const deleteResult = await this.deleteEntryUseCase.execute(this.model, scheduleId, {
            force: true,
            permanently: true
        });

        if (deleteResult.isFail()) {
            return Result.fail(
                new ScheduledActionPersistenceError(new Error(deleteResult.error.message))
            );
        }

        return Result.ok(undefined);
    }
}

export const CancelScheduledActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: CancelScheduledActionUseCaseImpl,
    dependencies: [
        GetScheduledActionUseCase,
        SchedulerService,
        DeleteEntryUseCase,
        ScheduledActionModel
    ]
});
