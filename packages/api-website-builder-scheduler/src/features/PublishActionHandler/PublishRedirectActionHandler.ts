import {
    ScheduledActionHandler,
    ScheduledActionType,
    type IScheduledAction
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { UpdateRedirectUseCase } from "@webiny/api-website-builder/exports/api/website-builder/redirect.js";
import type { IScheduledActionPayload } from "~/types.js";
import { extractModelIdFromNamespace } from "~/utils/namespace.js";
import { SCHEDULED_ACTION_TYPE_REDIRECT } from "~/constants.js";

/**
 * Handles the scheduled "publish" action for Website Builder redirects.
 * Publishing a redirect means enabling it (isEnabled: true).
 */
class PublishRedirectActionHandlerImpl implements ScheduledActionHandler.Interface {
    constructor(private updateRedirectUseCase: UpdateRedirectUseCase.Interface) {}

    public canHandle(namespace: string, actionType: ScheduledActionType): boolean {
        return (
            extractModelIdFromNamespace(namespace) === SCHEDULED_ACTION_TYPE_REDIRECT &&
            actionType === "publish"
        );
    }

    public async handle(action: IScheduledAction<IScheduledActionPayload>): Promise<void> {
        const result = await this.updateRedirectUseCase.execute(action.targetId, {
            isEnabled: true
        });
        if (result.isFail()) {
            console.error(`Failed to enable redirect "${action.targetId}":`, result.error);
            throw new Error(`Failed to enable redirect: ${action.targetId}`);
        }
    }
}

export const PublishRedirectActionHandler = ScheduledActionHandler.createImplementation({
    implementation: PublishRedirectActionHandlerImpl,
    dependencies: [UpdateRedirectUseCase]
});
