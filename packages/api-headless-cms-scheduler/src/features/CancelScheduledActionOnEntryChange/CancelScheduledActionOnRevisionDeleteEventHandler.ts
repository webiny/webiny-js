import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events";
import {
    CancelScheduledActionUseCase,
    ListScheduledActionsUseCase
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { Logger } from "@webiny/api-core/exports/api/logger.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createNamespace } from "~/utils/namespace.js";

/**
 * Cancels scheduled actions when an entry revision is deleted
 *
 * When a user deletes an entry revision, any scheduled publish/unpublish
 * action for that revision should be canceled since the revision
 * no longer exists.
 */
class CancelScheduledActionOnDeleteHandlerImpl implements EntryAfterDeleteEventHandler.Interface {
    constructor(
        private listScheduledActions: ListScheduledActionsUseCase.Interface,
        private cancelScheduledAction: CancelScheduledActionUseCase.Interface,
        private logger: Logger.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;

        // Skip private models
        if (model.isPrivate) {
            return;
        }

        /**
         * System cleanup after a delete the user was allowed to do: list and cancel every schedule
         * for the deleted target, without the caller's permission checks (the target no longer exists).
         */
        const actionsResult = await this.identityContext.withoutAuthorization(() => {
            return this.listScheduledActions.execute({
                where: {
                    namespace: createNamespace(model),
                    targetId: entry.id
                }
            });
        });

        if (actionsResult.isFail()) {
            this.logger.error(actionsResult.error);
            return;
        }

        const actions = actionsResult.value.items;

        for (const action of actions) {
            const cancelRes = await this.identityContext.withoutAuthorization(() => {
                return this.cancelScheduledAction.execute(action);
            });
            if (cancelRes.isFail()) {
                // Silently ignore errors - this is non-critical cleanup.
                // Entry was deleted successfully, cancelling scheduled actions is best-effort.
            }
        }
    }
}

export const CancelScheduledActionOnRevisionDeleteEventHandler =
    EntryAfterDeleteEventHandler.createImplementation({
        implementation: CancelScheduledActionOnDeleteHandlerImpl,
        dependencies: [
            ListScheduledActionsUseCase,
            CancelScheduledActionUseCase,
            Logger,
            IdentityContext
        ]
    });
