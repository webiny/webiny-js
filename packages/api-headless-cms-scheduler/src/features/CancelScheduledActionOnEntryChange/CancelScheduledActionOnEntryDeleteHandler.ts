import { EntryAfterDeleteHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events";
import { ListScheduledActionsUseCase, CancelScheduledActionUseCase } from "@webiny/api-scheduler";

/**
 * Cancels scheduled actions when an entry is deleted
 *
 * When a user deletes an entry, any scheduled publish/unpublish
 * actions for all of its revisions should be canceled since the entry
 * no longer exists.
 */
class CancelScheduledActionOnEntryDeleteHandlerImpl implements EntryAfterDeleteHandler.Interface {
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

        const schedules = await this.listSchedules(model.modelId, entry.entryId);
        for (const action of schedules) {
            const cancelRes = await this.cancelScheduledEntryAction.execute(action.id);
            if (cancelRes.isFail()) {
                // Silently ignore errors - this is non-critical cleanup.
                // The entry was deleted successfully, cancelling scheduled actions is best-effort.
            }
        }
    }

    private async listSchedules(modelId: string, entryId: string) {
        const actionsResult = await this.listScheduledActions.execute({
            limit: 10000,
            where: {
                namespace: `Cms/Entry/${modelId}`,
                targetId_startsWith: `${entryId}#`
            }
        });

        return actionsResult.value.items;
    }
}

export const CancelScheduledActionOnEntryDeleteHandler =
    EntryAfterDeleteHandler.createImplementation({
        implementation: CancelScheduledActionOnEntryDeleteHandlerImpl,
        dependencies: [ListScheduledActionsUseCase, CancelScheduledActionUseCase]
    });
