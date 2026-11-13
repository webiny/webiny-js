import { PageAfterDeleteEventHandler } from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import {
    CancelScheduledActionUseCase,
    ListScheduledActionsUseCase
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { Logger } from "@webiny/api-core/exports/api/logger.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createNamespace } from "~/utils/namespace.js";
import { SCHEDULED_ACTION_TYPE_PAGE } from "~/constants.js";

/**
 * Cancels scheduled actions when a page is deleted.
 *
 * When a user deletes a page revision, any scheduled publish/unpublish
 * actions for that revision should be canceled since the page no longer exists.
 */
class CancelScheduledActionOnPageDeleteHandlerImpl
    implements PageAfterDeleteEventHandler.Interface
{
    constructor(
        private listScheduledActions: ListScheduledActionsUseCase.Interface,
        private cancelScheduledAction: CancelScheduledActionUseCase.Interface,
        private logger: Logger.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async handle(event: PageAfterDeleteEventHandler.Event): Promise<void> {
        const { page } = event.payload;

        /**
         * System cleanup after a delete the user was allowed to do: list and cancel every schedule
         * for the deleted target, without the caller's permission checks (the target no longer exists).
         */
        const actionsResult = await this.identityContext.withoutAuthorization(() => {
            return this.listScheduledActions.execute({
                limit: 10000,
                where: {
                    namespace: createNamespace(SCHEDULED_ACTION_TYPE_PAGE),
                    targetId: page.id
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
                // The page was deleted successfully, cancelling scheduled actions is best-effort.
            }
        }
    }
}

export const CancelScheduledActionOnPageDeleteEventHandler =
    PageAfterDeleteEventHandler.createImplementation({
        implementation: CancelScheduledActionOnPageDeleteHandlerImpl,
        dependencies: [
            ListScheduledActionsUseCase,
            CancelScheduledActionUseCase,
            Logger,
            IdentityContext
        ]
    });
