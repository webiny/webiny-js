import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { parseIdentifier } from "@webiny/utils";
import { ScheduleActionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetScheduledActionUseCase } from "~/features/GetScheduledAction/abstractions.js";
import type { Identity, IScheduledAction, ScheduledActionType } from "~/shared/abstractions.js";
import { ScheduledActionModel, SchedulerService } from "~/shared/abstractions.js";
import {
    InvalidScheduleDateError,
    ScheduledActionPersistenceError,
    SchedulerServiceError
} from "~/domain/errors.js";
import { ScheduledActionId } from "~/domain/ScheduledActionId.js";
import { ScheduledActionIdWithVersion } from "~/domain/ScheduledActionIdWithVersion.js";
import { isValidDate } from "~/domain/isValidDate.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { NamespaceHandlerExecutioner } from "~/features/NamespaceHandler/abstractions.js";

interface ICreateScheduleParams<T extends GenericRecord> {
    scheduleId: string;
    title: string;
    namespace: string;
    actionType: ScheduledActionType;
    targetId: string;
    scheduleFor: string;
    identity: Identity;
    payload: T;
}
/**
 * Schedules an action for future execution
 *
 * Flow:
 * 1. Generate unique schedule ID from namespace+actionType+targetId
 * 2. Check if schedule already exists (for rescheduling logic)
 * 3. If exists: UPDATE schedule entry + EventBridge schedule
 * 4. If new: CREATE schedule entry + EventBridge schedule
 * 5. Rollback schedule entry if EventBridge fails
 */
class ScheduleActionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private model: ScheduledActionModel.Interface,
        private schedulerService: SchedulerService.Interface,
        private getScheduledAction: GetScheduledActionUseCase.Interface,
        private createEntryUseCase: CreateEntryUseCase.Interface,
        private updateEntryUseCase: UpdateEntryUseCase.Interface,
        private deleteEntryUseCase: DeleteEntryUseCase.Interface,
        private namespaceHandlerExecutioner: NamespaceHandlerExecutioner.Interface
    ) {}

    async execute<T extends GenericRecord>(
        params: UseCaseAbstraction.Params
    ): Promise<Result<IScheduledAction<T>, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();

        let scheduleFor = params.scheduleFor;
        /**
         * Immeditely - publish in past
         */
        if (!params.immediately && !isValidDate(scheduleFor)) {
            return Result.fail(new InvalidScheduleDateError(scheduleFor));
        } else if (params.immediately) {
            // If the action should be executed immediately, we set the scheduleFor to the current date.
            // Calculate the soonest possible execution time.
            // Add at least 90 seconds of buffer to ensure EventBridge can process the schedule.
            scheduleFor = new Date(Date.now() + 90000).toISOString();
        }

        // Generate unique schedule ID
        const actionId = ScheduledActionId.from({
            namespace: params.namespace,
            targetId: params.targetId,
            actionType: params.actionType
        });
        const scheduleId = ScheduledActionIdWithVersion.from(actionId);

        const existingResult = await this.getScheduledAction.execute({
            namespace: params.namespace,
            id: scheduleId
        });

        const namespaceHandlerResult = await this.namespaceHandlerExecutioner.execute({
            scheduleId,
            immediately: params.immediately,
            scheduleFor,
            targetId: params.targetId,
            actionType: params.actionType,
            namespace: params.namespace
        });

        if (namespaceHandlerResult.isFail()) {
            return Result.fail(namespaceHandlerResult.error);
        }
        const payload = namespaceHandlerResult.value;

        if (existingResult.isFail()) {
            const error = existingResult.error;

            // NotFound means the action was not yet scheduled
            if (error.code === "Scheduler/ScheduledAction/NotFound") {
                return this.createSchedule({
                    scheduleId,
                    title: payload.title,
                    namespace: params.namespace,
                    actionType: params.actionType,
                    targetId: params.targetId,
                    scheduleFor,
                    identity,
                    payload
                });
            }

            if (error.code === "Scheduler/ScheduledAction/PersistenceError") {
                return Result.fail(error);
            }
        }

        // Reschedule existing action
        const scheduledAction = existingResult.value;

        return this.reschedule(scheduledAction, params.scheduleFor, identity, payload);
    }

    /**
     * Creates a new schedule
     */
    private async createSchedule<T extends GenericRecord>(
        params: ICreateScheduleParams<T>
    ): Promise<Result<IScheduledAction<T>, UseCaseAbstraction.Error>> {
        const {
            scheduleId: initialId,
            identity,
            payload,
            scheduleFor,
            actionType,
            targetId,
            title,
            namespace
        } = params;
        const { id: scheduleId } = parseIdentifier(initialId);

        const scheduledAction: IScheduledAction<T> = {
            id: scheduleId,
            title,
            namespace,
            actionType,
            targetId,
            scheduledBy: {
                id: identity.id,
                type: identity.type,
                displayName: identity.displayName
            },
            scheduledFor: scheduleFor,
            payload
        };

        // Create CMS entry
        const createResult = await this.createEntryUseCase.execute<IScheduledAction<T>>(
            this.model,
            {
                id: scheduleId,
                values: scheduledAction
            }
        );

        if (createResult.isFail()) {
            return Result.fail(
                new ScheduledActionPersistenceError(new Error(createResult.error.message))
            );
        }

        // Create EventBridge schedule
        try {
            await this.schedulerService.create({
                id: scheduleId,
                namespace,
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
    private async reschedule<T extends GenericRecord>(
        existing: IScheduledAction<T>,
        scheduleFor: string,
        identity: Identity,
        payload?: any
    ): Promise<Result<IScheduledAction<T>, UseCaseAbstraction.Error>> {
        // Make sure we don't unset the existing payload.
        if (!payload && existing.payload) {
            payload = existing.payload;
        }

        // Update CMS entry
        const existingEntryId = ScheduledActionIdWithVersion.from(existing.id);
        const updateResult = await this.updateEntryUseCase.execute<IScheduledAction<T>>(
            this.model,
            existingEntryId,
            {
                values: {
                    scheduledBy: {
                        id: identity.id,
                        type: identity.type,
                        displayName: identity.displayName
                    },
                    scheduledFor: scheduleFor,
                    payload
                }
            }
        );

        if (updateResult.isFail()) {
            return Result.fail(
                new ScheduledActionPersistenceError(new Error(updateResult.error.message))
            );
        }

        // Update EventBridge schedule
        try {
            await this.schedulerService.update({
                id: existing.id,
                namespace: existing.namespace,
                scheduleFor: new Date(scheduleFor)
            });
        } catch (error) {
            return Result.fail(new SchedulerServiceError(error as Error));
        }

        return Result.ok({
            ...existing,
            scheduledBy: {
                id: identity.id,
                type: identity.type,
                displayName: identity.displayName
            },
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
        DeleteEntryUseCase,
        NamespaceHandlerExecutioner
    ]
});
