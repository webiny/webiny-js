import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { parseIdentifier } from "@webiny/utils";
import { ScheduleActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/abstractions.js";
import { ScheduledActionModel, SchedulerService } from "~/shared/abstractions.js";
import type { IScheduledAction, Identity } from "~/shared/abstractions.js";
import {
    InvalidScheduleDateError,
    ScheduledActionPersistenceError,
    SchedulerServiceError
} from "~/domain/errors.js";
import { ScheduledActionId } from "~/domain/ScheduledActionId.js";
import { ScheduledActionIdWithVersion } from "~/domain/ScheduledActionIdWithVersion.js";
import { isValidDate } from "~/domain/isValidDate.js";

/**
 * Schedules an action for future execution
 *
 * Flow:
 * 1. Generate unique schedule ID from namespace+actionType+targetId
 * 2. Check if schedule already exists (for rescheduling logic)
 * 3. If exists: UPDATE schedule entry + EventBridge schedule
 * 4. If new: CREATE schedule entry + EventBridge schedule
 * 5. Rollback schedule entry if EventBridge fails
 *
 * Note: Does NOT handle immediate execution - apps use direct use cases for that
 */
class ScheduleActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private model: ScheduledActionModel.Interface,
        private schedulerService: SchedulerService.Interface,
        private getScheduledAction: GetScheduledActionUseCase.Interface,
        private createEntryUseCase: CreateEntryUseCase.Interface,
        private updateEntryUseCase: UpdateEntryUseCase.Interface,
        private deleteEntryUseCase: DeleteEntryUseCase.Interface
    ) {}

    async execute(
        params: UseCaseAbstraction.Params
    ): Promise<Result<IScheduledAction, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();

        if (!isValidDate(params.scheduleFor)) {
            return Result.fail(new InvalidScheduleDateError(params.scheduleFor));
        }

        // Generate unique schedule ID
        const actionId = ScheduledActionId.from(params);
        const scheduleId = ScheduledActionIdWithVersion.from(actionId);

        const existingResult = await this.getScheduledAction.execute(scheduleId);

        if (existingResult.isFail()) {
            const error = existingResult.error;

            // NotFound means the action was not yet scheduled
            if (error.code === "Scheduler/ScheduledAction/NotFound") {
                return this.createSchedule(
                    scheduleId,
                    params.title,
                    params.namespace,
                    params.actionType,
                    params.targetId,
                    params.scheduleFor,
                    identity,
                    params.payload
                );
            }

            if (error.code === "Scheduler/ScheduledAction/PersistenceError") {
                return Result.fail(error);
            }
        }

        // Reschedule existing action
        const scheduledAction = existingResult.value;

        return this.reschedule(scheduledAction, params.scheduleFor, identity, params.payload);
    }

    /**
     * Creates a new schedule
     */
    private async createSchedule(
        id: string,
        title: string,
        namespace: string,
        actionType: string,
        targetId: string,
        scheduleFor: string,
        identity: Identity,
        payload?: any
    ): Promise<Result<IScheduledAction, UseCaseAbstraction.Error>> {
        const { id: scheduleId } = parseIdentifier(id);

        const scheduledAction: IScheduledAction = {
            id: scheduleId,
            title,
            namespace,
            actionType,
            targetId,
            scheduledBy: identity,
            scheduledFor: scheduleFor,
            payload
        };

        // Create CMS entry
        const createResult = await this.createEntryUseCase.execute(this.model, scheduledAction);

        if (createResult.isFail()) {
            return Result.fail(
                new ScheduledActionPersistenceError(new Error(createResult.error.message))
            );
        }

        // Create EventBridge schedule
        try {
            await this.schedulerService.create({
                id: scheduleId,
                scheduleFor: new Date(scheduleFor)
            });
        } catch (error) {
            // Rollback - delete CMS entry if EventBridge fails
            console.error(`Failed to create EventBridge schedule: ${scheduleId}. Rolling back...`);

            await this.deleteEntryUseCase.execute(this.model, scheduleId, {
                force: true,
                permanently: true
            });

            return Result.fail(new SchedulerServiceError(error as Error));
        }

        return Result.ok(scheduledAction);
    }

    /**
     * Updates an existing schedule (reschedule)
     */
    private async reschedule(
        existing: IScheduledAction,
        scheduleFor: string,
        identity: Identity,
        payload?: any
    ): Promise<Result<IScheduledAction, UseCaseAbstraction.Error>> {
        // Make sure we don't unset the existing payload.
        if (!payload && existing.payload) {
            payload = existing.payload;
        }

        // Update CMS entry
        const existingEntryId = ScheduledActionIdWithVersion.from(existing.id);
        const updateResult = await this.updateEntryUseCase.execute(this.model, existingEntryId, {
            scheduledBy: identity,
            scheduledFor: scheduleFor,
            payload
        });

        if (updateResult.isFail()) {
            return Result.fail(
                new ScheduledActionPersistenceError(new Error(updateResult.error.message))
            );
        }

        // Update EventBridge schedule
        try {
            await this.schedulerService.update({
                id: existing.id,
                scheduleFor: new Date(scheduleFor)
            });
        } catch (error) {
            return Result.fail(new SchedulerServiceError(error as Error));
        }

        return Result.ok({
            ...existing,
            scheduledBy: identity,
            scheduledFor: scheduleFor,
            payload
        });
    }
}

export const ScheduleActionUseCase = UseCaseAbstraction.createImplementation({
    implementation: ScheduleActionUseCaseImpl,
    dependencies: [
        IdentityContext,
        ScheduledActionModel,
        SchedulerService,
        GetScheduledActionUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        DeleteEntryUseCase
    ]
});
