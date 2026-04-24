import { EntryAfterPublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/events";
import {
    CancelScheduledActionUseCase,
    ListScheduledActionsUseCase,
    ScheduledActionTypePublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { createNamespace } from "~/utils/namespace.js";

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
        private cancelScheduledAction: CancelScheduledActionUseCase.Interface
    ) {}

    async handle(event: EntryAfterPublishEventHandler.Event): Promise<void> {
        const { entry, model } = event.payload;

        // Skip private models
        if (model.isPrivate) {
            return;
        }

        const actionsResult = await this.listScheduledActions.execute({
            where: {
                namespace: createNamespace(model),
                actionType: ScheduledActionTypePublish,
                targetId: entry.id
            }
        });

        const actions = actionsResult.value.items;

        for (const action of actions) {
            const cancelRes = await this.cancelScheduledAction.execute(action);
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
