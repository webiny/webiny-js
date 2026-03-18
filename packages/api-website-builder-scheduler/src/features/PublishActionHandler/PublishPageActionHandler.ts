import {
    ScheduledActionHandler,
    ScheduledActionType,
    type IScheduledAction
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { PublishPageUseCase } from "@webiny/api-website-builder/exports/api/website-builder/page.js";
import type { IScheduledActionPayload } from "~/types.js";
import { extractModelIdFromNamespace } from "~/utils/namespace.js";
import { SCHEDULED_ACTION_TYPE_PAGE } from "~/constants.js";

/**
 * Handles the scheduled "publish" action for Website Builder pages.
 */
class PublishPageActionHandlerImpl implements ScheduledActionHandler.Interface {
    constructor(private publishPageUseCase: PublishPageUseCase.Interface) {}

    public canHandle(namespace: string, actionType: ScheduledActionType): boolean {
        return (
            extractModelIdFromNamespace(namespace) === SCHEDULED_ACTION_TYPE_PAGE &&
            actionType === "publish"
        );
    }

    public async handle(action: IScheduledAction<IScheduledActionPayload>): Promise<void> {
        const result = await this.publishPageUseCase.execute({ id: action.targetId });
        if (result.isFail()) {
            console.error(`Failed to publish page "${action.targetId}":`, result.error);
            throw new Error(`Failed to publish page: ${action.targetId}`);
        }
    }
}

export const PublishPageActionHandler = ScheduledActionHandler.createImplementation({
    implementation: PublishPageActionHandlerImpl,
    dependencies: [PublishPageUseCase]
});
