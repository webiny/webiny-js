import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/events";
import { CancelScheduledActionUseCase, ListScheduledActionsUseCase } from "@webiny/api-scheduler";
import { createNamespace } from "~/utils/namespace.js";

/**
 * Cancels scheduled actions when an entry is deleted
 *
 * When a user deletes an entry, any scheduled publish/unpublish
 * actions for all of its revisions should be canceled since the entry
 * no longer exists.
 */
class CancelScheduledActionOnEntryDeleteHandlerImpl
    implements EntryAfterDeleteEventHandler.Interface
{
    constructor(
        private listScheduledActions: ListScheduledActionsUseCase.Interface,
        private cancelScheduledAction: CancelScheduledActionUseCase.Interface
    ) {}

    async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;

        // Skip private models
        if (model.isPrivate) {
            return;
        }

        const schedules = await this.listSchedules(model.modelId, entry.entryId);
        for (const action of schedules) {
            const cancelRes = await this.cancelScheduledAction.execute(action);
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
                namespace: createNamespace({ modelId }),
                targetId_startsWith: `${entryId}#`
            }
        });

        return actionsResult.value.items;
    }
}

export const CancelScheduledActionOnEntryDeleteEventHandler =
    EntryAfterDeleteEventHandler.createImplementation({
        implementation: CancelScheduledActionOnEntryDeleteHandlerImpl,
        dependencies: [ListScheduledActionsUseCase, CancelScheduledActionUseCase]
    });
