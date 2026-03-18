import { PageAfterUnpublishEventHandler } from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import {
    CancelScheduledActionUseCase,
    ListScheduledActionsUseCase,
    ScheduledActionTypeUnpublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { createNamespace } from "~/utils/namespace.js";
import { SCHEDULED_ACTION_TYPE_PAGE } from "~/constants.js";

/**
 * Cancels scheduled "unpublish" when a page is manually unpublished.
 *
 * When a user manually unpublishes a page, any scheduled unpublish
 * action for that page should be canceled since the manual action
 * takes precedence.
 */
class CancelScheduledActionOnUnpublishHandlerImpl
    implements PageAfterUnpublishEventHandler.Interface
{
    constructor(
        private listScheduledActions: ListScheduledActionsUseCase.Interface,
        private cancelScheduledAction: CancelScheduledActionUseCase.Interface
    ) {}

    async handle(event: PageAfterUnpublishEventHandler.Event): Promise<void> {
        const { page } = event.payload;

        const actionsResult = await this.listScheduledActions.execute({
            where: {
                namespace: createNamespace(SCHEDULED_ACTION_TYPE_PAGE),
                actionType: ScheduledActionTypeUnpublish,
                targetId: page.id
            }
        });

        const actions = actionsResult.value.items;

        for (const action of actions) {
            const cancelRes = await this.cancelScheduledAction.execute(action);
            if (cancelRes.isFail()) {
                // Silently ignore errors - this is non-critical cleanup.
                // Page was unpublished successfully, cancelling scheduled actions is best-effort.
            }
        }
    }
}

export const CancelScheduledActionOnPageUnpublishEventHandler =
    PageAfterUnpublishEventHandler.createImplementation({
        implementation: CancelScheduledActionOnUnpublishHandlerImpl,
        dependencies: [ListScheduledActionsUseCase, CancelScheduledActionUseCase]
    });
