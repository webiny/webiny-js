import { PageAfterDeleteHandler } from "@webiny/api-website-builder/features/pages/DeletePage/abstractions.js";
import { ListScheduledActionsUseCase, CancelScheduledActionUseCase } from "@webiny/api-scheduler";

/**
 * Cancels scheduled actions when a page is deleted.
 *
 * When a user deletes a page, any scheduled publish/unpublish
 * actions for all of its revisions should be canceled since the page
 * no longer exists.
 */
class CancelScheduledActionOnDeleteEventHandlerImpl implements PageAfterDeleteHandler.Interface {
    constructor(
        private listScheduledActions: ListScheduledActionsUseCase.Interface,
        private cancelScheduledAction: CancelScheduledActionUseCase.Interface
    ) {}

    async handle(event: PageAfterDeleteHandler.Event): Promise<void> {
        const { page } = event.payload;

        const schedules = await this.listSchedules(page.entryId);
        for (const action of schedules) {
            const cancelRes = await this.cancelScheduledAction.execute(action.id);
            if (cancelRes.isFail()) {
                // Silently ignore errors - this is non-critical cleanup.
                // The page was deleted successfully, cancelling scheduled actions is best-effort.
            }
        }
    }

    private async listSchedules(entryId: string) {
        const actionsResult = await this.listScheduledActions.execute({
            limit: 10000,
            where: {
                namespace: "Wb/Page",
                targetId_startsWith: `${entryId}#`
            }
        });

        if (actionsResult.isFail()) {
            return [];
        }

        return actionsResult.value.items;
    }
}

export const CancelScheduledActionOnDeleteEventHandler =
    PageAfterDeleteHandler.createImplementation({
        implementation: CancelScheduledActionOnDeleteEventHandlerImpl,
        dependencies: [ListScheduledActionsUseCase, CancelScheduledActionUseCase]
    });
