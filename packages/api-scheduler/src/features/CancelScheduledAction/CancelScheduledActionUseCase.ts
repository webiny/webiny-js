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
import { SchedulerPermissionsResolver } from "~/features/permissions/abstractions.js";
import { NamespaceHandlerExecutioner } from "~/features/NamespaceHandler/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

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
        private permissionsResolver: SchedulerPermissionsResolver.Interface,
        private namespaceHandlerExecutioner: NamespaceHandlerExecutioner.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(
        params: UseCaseAbstraction.Params
    ): Promise<Result<boolean, UseCaseAbstraction.Error>> {
        const { id, namespace } = params;
        const permissions = this.permissionsResolver.forNamespace(namespace);
        if (!(await permissions.canRead())) {
            return Result.fail(new NotAuthorizedError());
        }
        // Check if scheduled action exists
        const getResult = await this.getScheduledActionUseCase.execute(params);

        if (getResult.isFail()) {
            const error = getResult.error;

            if (error.code === "Scheduler/ScheduledAction/NotFound") {
                return Result.fail(new ScheduledActionNotFoundError(id));
            }

            return Result.fail(error);
        }

        /**
         * Cancelling requires the same permission as scheduling the action: the namespace handler
         * loads the target and checks it. If the target can't be loaded, the user either has no
         * access to it or it no longer exists; both are refused.
         *
         * System cleanup (e.g. after the target was deleted) runs under `withoutAuthorization`
         * and skips this check.
         */
        if (this.identityContext.isAuthorizationEnabled()) {
            const scheduledAction = getResult.value;
            const handlerResult = await this.namespaceHandlerExecutioner.execute({
                scheduleId: id,
                targetId: scheduledAction.targetId,
                actionType: scheduledAction.actionType,
                namespace: scheduledAction.namespace,
                immediately: false,
                scheduleFor: scheduledAction.scheduledFor
            });
            if (handlerResult.isFail()) {
                return Result.fail(new NotAuthorizedError());
            }
        }

        const scheduleId = ScheduledActionIdWithVersion.from(id);

        // Delete EventBridge schedule
        // Note: We continue even if this fails, as the schedule might already be executed/deleted
        try {
            const eventBridgeSchedule = await this.schedulerService.exists(params);
            /**
             * No point to even try deleting if it doesn't exist.
             */
            if (eventBridgeSchedule) {
                await this.schedulerService.delete(params);
            }
        } catch (error) {
            console.warn(
                `Failed to delete EventBridge schedule: ${scheduleId}, tenant "${params.tenant}". Continuing with CMS entry deletion.`,
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
        SchedulerPermissionsResolver,
        NamespaceHandlerExecutioner,
        IdentityContext
    ]
});
