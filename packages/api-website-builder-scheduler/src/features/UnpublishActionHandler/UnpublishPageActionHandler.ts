import {
    type IScheduledAction,
    ScheduledActionHandler
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { UnpublishPageUseCase } from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import type { IScheduledActionPayload } from "~/types.js";
import { extractModelIdFromNamespace } from "~/utils/namespace.js";
import { SCHEDULED_ACTION_TYPE_PAGE } from "~/constants.js";
import type { ScheduledActionType } from "@webiny/api-scheduler/shared/abstractions.js";

/**
 * Handles the scheduled "unpublish" action for Website Builder pages.
 */
class UnpublishPageActionHandlerImpl implements ScheduledActionHandler.Interface {
    constructor(private unpublishPageUseCase: UnpublishPageUseCase.Interface) {}

    canHandle(namespace: string, actionType: ScheduledActionType): boolean {
        return (
            extractModelIdFromNamespace(namespace) === SCHEDULED_ACTION_TYPE_PAGE &&
            actionType === "unpublish"
        );
    }

    async handle(action: IScheduledAction<IScheduledActionPayload>): Promise<void> {
        const result = await this.unpublishPageUseCase.execute({ id: action.targetId });
        if (result.isFail()) {
            console.error(`Failed to unpublish page "${action.targetId}":`, result.error);
            throw new Error(`Failed to unpublish page: ${action.targetId}`);
        }
    }
}

export const UnpublishPageActionHandler = ScheduledActionHandler.createImplementation({
    implementation: UnpublishPageActionHandlerImpl,
    dependencies: [UnpublishPageUseCase]
});
