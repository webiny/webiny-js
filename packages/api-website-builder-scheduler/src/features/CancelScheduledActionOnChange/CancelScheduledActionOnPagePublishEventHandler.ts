import { PageAfterPublishEventHandler } from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import {
    CancelScheduledActionUseCase,
    ListScheduledActionsUseCase,
    ScheduledActionTypePublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { createNamespace } from "~/utils/namespace.js";
import { SCHEDULED_ACTION_TYPE_PAGE } from "~/constants.js";

/**
 * Cancels scheduled "publish" when a page is manually published.
 *
 * When a user manually publishes a page, any scheduled publish
 * action for that page should be canceled since the manual action
 * takes precedence.
 */
class CancelScheduledActionOnPublishEventHandlerImpl
    implements PageAfterPublishEventHandler.Interface
{
    constructor(
        private listScheduledActions: ListScheduledActionsUseCase.Interface,
        private cancelScheduledAction: CancelScheduledActionUseCase.Interface
    ) {}

    async handle(event: PageAfterPublishEventHandler.Event): Promise<void> {
        const { page } = event.payload;

        const actionsResult = await this.listScheduledActions.execute({
            where: {
                namespace: createNamespace(SCHEDULED_ACTION_TYPE_PAGE),
                actionType: ScheduledActionTypePublish,
                targetId: page.id
            }
        });

        const actions = actionsResult.value.items;

        for (const action of actions) {
            const cancelRes = await this.cancelScheduledAction.execute(action);
            if (cancelRes.isFail()) {
                // Silently ignore errors - this is non-critical cleanup.
                // Even if a schedule runs on an already published page, nothing bad will happen.
            }
        }
    }
}

export const CancelScheduledActionOnPagePublishEventHandler =
    PageAfterPublishEventHandler.createImplementation({
        implementation: CancelScheduledActionOnPublishEventHandlerImpl,
        dependencies: [ListScheduledActionsUseCase, CancelScheduledActionUseCase]
    });
