import { PageAfterUnpublishHandler } from "@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.js";
import { CancelScheduledActionUseCase, ListScheduledActionsUseCase } from "@webiny/api-scheduler";

/**
 * Cancels scheduled action when a page is manually unpublished.
 *
 * When a user manually unpublishes a page revision, any scheduled unpublish
 * action for that revision should be canceled since the manual action
 * takes precedence.
 */
class CancelScheduledActionOnUnpublishEventHandlerImpl
    implements PageAfterUnpublishHandler.Interface
{
    constructor(
        private listScheduledActions: ListScheduledActionsUseCase.Interface,
        private cancelScheduledAction: CancelScheduledActionUseCase.Interface
    ) {}

    async handle(event: PageAfterUnpublishHandler.Event): Promise<void> {
        const { page } = event.payload;

        const actionsResult = await this.listScheduledActions.execute({
            where: {
                namespace: "Wb/Page",
                actionType: "Unpublish",
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
                // Page was unpublished successfully, cancelling scheduled actions is best-effort.
            }
        }
    }
}

export const CancelScheduledActionOnUnpublishEventHandler =
    PageAfterUnpublishHandler.createImplementation({
        implementation: CancelScheduledActionOnUnpublishEventHandlerImpl,
        dependencies: [ListScheduledActionsUseCase, CancelScheduledActionUseCase]
    });
