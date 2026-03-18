import {
    type IScheduledAction,
    ScheduledActionHandler
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { UpdateRedirectUseCase } from "@webiny/api-website-builder/exports/api/website-builder/redirect.js";
import type { IScheduledActionPayload } from "~/types.js";
import { extractModelIdFromNamespace } from "~/utils/namespace.js";
import { SCHEDULED_ACTION_TYPE_REDIRECT } from "~/constants.js";
import type { ScheduledActionType } from "@webiny/api-scheduler/shared/abstractions.js";

/**
 * Handles the scheduled "unpublish" action for Website Builder redirects.
 * Unpublishing a redirect means disabling it (isEnabled: false).
 */
class UnpublishRedirectActionHandlerImpl implements ScheduledActionHandler.Interface {
    constructor(private updateRedirectUseCase: UpdateRedirectUseCase.Interface) {}

    canHandle(namespace: string, actionType: ScheduledActionType): boolean {
        return (
            extractModelIdFromNamespace(namespace) === SCHEDULED_ACTION_TYPE_REDIRECT &&
            actionType === "unpublish"
        );
    }

    async handle(action: IScheduledAction<IScheduledActionPayload>): Promise<void> {
        const result = await this.updateRedirectUseCase.execute(action.targetId, {
            isEnabled: false
        });
        if (result.isFail()) {
            console.error(`Failed to disable redirect "${action.targetId}":`, result.error);
            throw new Error(`Failed to disable redirect: ${action.targetId}`);
        }
    }
}

export const UnpublishRedirectActionHandler = ScheduledActionHandler.createImplementation({
    implementation: UnpublishRedirectActionHandlerImpl,
    dependencies: [UpdateRedirectUseCase]
});
