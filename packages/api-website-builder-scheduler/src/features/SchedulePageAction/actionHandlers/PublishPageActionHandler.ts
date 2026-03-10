import { ScheduledActionHandler } from "@webiny/api-scheduler";
import { PublishPageUseCase } from "@webiny/api-website-builder/features/pages/PublishPage/abstractions.js";
import type { ISchedulePageActionWithPayload } from "~/features/SchedulePageAction/index.js";

/**
 * Handler for publishing WB pages.
 *
 * Handles the "Publish" action for WB pages with namespace: Wb/Page.
 *
 * Publishing logic:
 * 1. Resolve PublishPageUseCase from the container.
 * 2. Call execute with the target page revision ID.
 */
class PublishPageActionHandlerImpl implements ScheduledActionHandler.Interface {
    constructor(private publishPageUseCase: PublishPageUseCase.Interface) {}

    public canHandle(namespace: string, actionType: string): boolean {
        return namespace === "Wb/Page" && actionType === "Publish";
    }

    public async handle(action: ISchedulePageActionWithPayload): Promise<void> {
        const result = await this.publishPageUseCase.execute({ id: action.targetId });

        if (result.isFail()) {
            console.error(
                `Failed to publish page "${action.targetId}" for scheduled publish action:`,
                result.error
            );
            throw new Error(`Failed to publish page: ${action.targetId}`);
        }
    }
}

export const PublishPageActionHandler = ScheduledActionHandler.createImplementation({
    implementation: PublishPageActionHandlerImpl,
    dependencies: [PublishPageUseCase]
});
