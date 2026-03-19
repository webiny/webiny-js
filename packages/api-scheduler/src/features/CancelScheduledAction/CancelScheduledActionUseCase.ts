import { Result } from "@webiny/feature/api";
import { CancelScheduledActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/abstractions.js";
import { ScheduledActionModel, SchedulerService } from "~/shared/abstractions.js";
import {
    NotAuthorizedError,
    ScheduledActionNotFoundError,
    ScheduledActionPersistenceError
} from "~/domain/errors.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { ScheduledActionIdWithVersion } from "~/domain/ScheduledActionIdWithVersion.js";
import { EntryNotFoundError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { SchedulerPermissions } from "~/domain/permissions.js";

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
        private model: ScheduledActionModel.Interface,
        private permissions: SchedulerPermissions.Interface
    ) {}

    async execute(
        params: UseCaseAbstraction.Params
    ): Promise<Result<boolean, UseCaseAbstraction.Error>> {
        const hasPermission = await this.permissions.canRead("action");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }
        const { id } = params;
        // Check if scheduled action exists
        const getResult = await this.getScheduledActionUseCase.execute(params);

        if (getResult.isFail()) {
            const error = getResult.error;

            if (error.code === "Scheduler/ScheduledAction/NotFound") {
                return Result.fail(new ScheduledActionNotFoundError(id));
            }

            return Result.fail(error);
        }

        const scheduleId = ScheduledActionIdWithVersion.from(id);

        // Delete EventBridge schedule
        // Note: We continue even if this fails, as the schedule might already be executed/deleted
        try {
            const eventBridgeSchedule = await this.schedulerService.exists(id);
            /**
             * No point to even try deleting if it doesn't exist.
             */
            if (eventBridgeSchedule) {
                await this.schedulerService.delete(id);
            }
        } catch (error) {
            console.warn(
                `Failed to delete EventBridge schedule: ${scheduleId}. Continuing with CMS entry deletion.`,
                error
            );
        }

        // Delete CMS entry
        const deleteResult = await this.deleteEntryUseCase.execute(this.model, getResult.value.id, {
            force: true,
            permanently: true
        });

        if (deleteResult.isFail()) {
            /**
             * Some process could have already deleted the entry, in which case we can safely ignore this error.
             */
            if (deleteResult.error instanceof EntryNotFoundError) {
                return Result.ok(true);
            }
            return Result.fail(
                new ScheduledActionPersistenceError(new Error(deleteResult.error.message))
            );
        }

        return Result.ok(true);
    }
}

export const CancelScheduledActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: CancelScheduledActionUseCaseImpl,
    dependencies: [
        GetScheduledActionUseCase,
        SchedulerService,
        DeleteEntryUseCase,
        ScheduledActionModel,
        SchedulerPermissions.Abstraction
    ]
});
