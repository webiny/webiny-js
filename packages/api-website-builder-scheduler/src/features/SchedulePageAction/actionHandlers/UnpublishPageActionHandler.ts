import { ScheduledActionHandler } from "@webiny/api-scheduler";
import { UnpublishPageUseCase } from "@webiny/api-website-builder/features/pages/UnpublishPage/abstractions.js";
import type { ISchedulePageActionWithPayload } from "~/features/SchedulePageAction/index.js";

/**
 * Handler for unpublishing WB pages.
 *
 * Handles the "Unpublish" action for WB pages with namespace: Wb/Page.
 *
 * Unpublishing logic:
 * 1. Resolve UnpublishPageUseCase from the container.
 * 2. Call execute with the target page revision ID.
 */
class UnpublishPageActionHandlerImpl implements ScheduledActionHandler.Interface {
    constructor(private unpublishPageUseCase: UnpublishPageUseCase.Interface) {}

    public canHandle(namespace: string, actionType: string): boolean {
        return namespace === "Wb/Page" && actionType === "Unpublish";
    }

    public async handle(action: ISchedulePageActionWithPayload): Promise<void> {
        const result = await this.unpublishPageUseCase.execute({ id: action.targetId });

        if (result.isFail()) {
            console.error(
                `Failed to unpublish page "${action.targetId}" for scheduled unpublish action:`,
                result.error
            );
            throw new Error(`Failed to unpublish page: ${action.targetId}`);
        }
    }
}

export const UnpublishPageActionHandler = ScheduledActionHandler.createImplementation({
    implementation: UnpublishPageActionHandlerImpl,
    dependencies: [UnpublishPageUseCase]
});
