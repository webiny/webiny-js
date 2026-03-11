import { PageAfterPublishEventHandler } from "@webiny/api-website-builder/features/pages/PublishPage/abstractions.js";
import { CancelScheduledActionUseCase, ListScheduledActionsUseCase } from "@webiny/api-scheduler";

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
                namespace: "Wb/Page",
                actionType: "Publish",
                targetId: page.id
            }
        });

        if (actionsResult.isFail()) {
            return;
        }

        const actions = actionsResult.value.items;

        for (const action of actions) {
            const cancelRes = await this.cancelScheduledAction.execute(action.id);
            if (cancelRes.isFail()) {
                // Silently ignore errors - this is non-critical cleanup.
                // Even if a schedule runs on an already published page, nothing bad will happen.
            }
        }
    }
}

export const CancelScheduledActionOnPublishEventHandler =
    PageAfterPublishEventHandler.createImplementation({
        implementation: CancelScheduledActionOnPublishEventHandlerImpl,
        dependencies: [ListScheduledActionsUseCase, CancelScheduledActionUseCase]
    });
