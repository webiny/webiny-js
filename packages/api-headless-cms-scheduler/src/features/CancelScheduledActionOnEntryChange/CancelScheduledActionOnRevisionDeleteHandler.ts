import { EntryAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events";
import { CancelScheduledActionUseCase, ListScheduledActionsUseCase } from "@webiny/api-scheduler";

/**
 * Cancels scheduled actions when an entry revision is deleted
 *
 * When a user deletes an entry revision, any scheduled publish/unpublish
 * action for that revision should be canceled since the revision
 * no longer exists.
 */
class CancelScheduledActionOnDeleteHandlerImpl implements EntryAfterDeleteHandler.Interface {
    constructor(
        private listScheduledActions: ListScheduledActionsUseCase.Interface,
        private cancelScheduledEntryAction: CancelScheduledActionUseCase.Interface
    ) {}

    async handle(event: EntryAfterDeleteHandler.Event): Promise<void> {
        const { entry, model } = event.payload;

        // Skip private models
        if (model.isPrivate) {
            return;
        }

        const actionsResult = await this.listScheduledActions.execute({
            where: {
                namespace: `Cms/Entry/${model.modelId}`,
                targetId: entry.id
            }
        });

        const actions = actionsResult.value.items;

        for (const action of actions) {
            const cancelRes = await this.cancelScheduledEntryAction.execute(action.id);
            if (cancelRes.isFail()) {
                // Silently ignore errors - this is non-critical cleanup.
                // Entry was deleted successfully, cancelling scheduled actions is best-effort.
            }
        }
    }
}

export const CancelScheduledActionOnRevisionDeleteHandler =
    EntryAfterDeleteHandler.createImplementation({
        implementation: CancelScheduledActionOnDeleteHandlerImpl,
        dependencies: [ListScheduledActionsUseCase, CancelScheduledActionUseCase]
    });
