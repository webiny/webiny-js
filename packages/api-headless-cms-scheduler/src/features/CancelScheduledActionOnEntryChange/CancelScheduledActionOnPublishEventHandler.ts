import { EntryAfterPublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/events";
import { CancelScheduledActionUseCase, ListScheduledActionsUseCase } from "@webiny/api-scheduler";

/**
 * Cancels scheduled "publish" when an entry is manually published
 *
 * When a user manually publishes an entry, any scheduled publish
 * action for that entry should be canceled since the manual action
 * takes precedence.
 */
class CancelScheduledActionOnPublishEventHandlerImpl
    implements EntryAfterPublishEventHandler.Interface
{
    constructor(
        private listScheduledActions: ListScheduledActionsUseCase.Interface,
        private cancelScheduledEntryAction: CancelScheduledActionUseCase.Interface
    ) {}

    async handle(event: EntryAfterPublishEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;

        // Skip private models
        if (model.isPrivate) {
            return;
        }

        const actionsResult = await this.listScheduledActions.execute({
            where: {
                namespace: `Cms/Entry/${model.modelId}`,
                actionType: "Publish",
                targetId: entry.id
            }
        });

        const actions = actionsResult.value.items;

        for (const action of actions) {
            const cancelRes = await this.cancelScheduledEntryAction.execute(action.id);
            if (cancelRes.isFail()) {
                // Silently ignore errors - this is non-critical cleanup.
                // Even if a schedule runs on an already published action, nothing bad will happen.
            }
        }
    }
}

export const CancelScheduledActionOnPublishEventHandler =
    EntryAfterPublishEventHandler.createImplementation({
        implementation: CancelScheduledActionOnPublishEventHandlerImpl,
        dependencies: [ListScheduledActionsUseCase, CancelScheduledActionUseCase]
    });
