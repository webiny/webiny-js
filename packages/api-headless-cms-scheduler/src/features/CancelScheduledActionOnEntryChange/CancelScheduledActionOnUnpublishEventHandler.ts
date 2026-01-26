import { EntryAfterUnpublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/events";
import { CancelScheduledActionUseCase, ListScheduledActionsUseCase } from "@webiny/api-scheduler";

/**
 * Cancels scheduled action when an entry is manually unpublished
 *
 * When a user manually unpublishes an entry revision, any scheduled unpublish
 * action for that revision should be canceled since the manual action
 * takes precedence.
 */
class CancelScheduledActionOnUnpublishHandlerImpl implements EntryAfterUnpublishEventHandler.Interface {
    constructor(
        private listScheduledActions: ListScheduledActionsUseCase.Interface,
        private cancelScheduledEntryAction: CancelScheduledActionUseCase.Interface
    ) {}

    async handle(event: EntryAfterUnpublishEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;

        // Skip private models
        if (model.isPrivate) {
            return;
        }

        const actionsResult = await this.listScheduledActions.execute({
            where: {
                namespace: `Cms/Entry/${model.modelId}`,
                actionType: "Unpublish",
                targetId: entry.id
            }
        });

        const actions = actionsResult.value.items;

        for (const action of actions) {
            const cancelRes = await this.cancelScheduledEntryAction.execute(action.id);
            if (cancelRes.isFail()) {
                // Silently ignore errors - this is non-critical cleanup.
                // Entry was unpublished successfully, cancelling scheduled actions is best-effort.
            }
        }
    }
}

export const CancelScheduledActionOnUnpublishEventHandler =
    EntryAfterUnpublishEventHandler.createImplementation({
        implementation: CancelScheduledActionOnUnpublishHandlerImpl,
        dependencies: [ListScheduledActionsUseCase, CancelScheduledActionUseCase]
    });
