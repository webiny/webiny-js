import { PageAfterDeleteEventHandler } from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import {
    CancelScheduledActionUseCase,
    ListScheduledActionsUseCase
} from "@webiny/api-scheduler/exports/api/scheduler.js";
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
        private cancelScheduledAction: CancelScheduledActionUseCase.Interface
    ) {}

    async handle(event: PageAfterDeleteEventHandler.Event): Promise<void> {
        const { page } = event.payload;

        const actionsResult = await this.listScheduledActions.execute({
            limit: 10000,
            where: {
                namespace: createNamespace(SCHEDULED_ACTION_TYPE_PAGE),
                targetId: page.id
            }
        });

        const actions = actionsResult.value.items;

        for (const action of actions) {
            const cancelRes = await this.cancelScheduledAction.execute(action);
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
        dependencies: [ListScheduledActionsUseCase, CancelScheduledActionUseCase]
    });
