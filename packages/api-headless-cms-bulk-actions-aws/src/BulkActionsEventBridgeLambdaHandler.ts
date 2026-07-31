import type { Container } from "@webiny/feature/api";
import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import {
    EventBridgeEventHandler,
    type EventBridgeResult
} from "@webiny/event-handler-aws/abstractions/handlers/EventBridgeEventHandler.js";
import { RequestContainer } from "@webiny/event-handler-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

const DETAIL_TYPE = "WebinyEmptyTrashBin";

class BulkActionsEventBridgeLambdaHandlerImpl implements EventBridgeEventHandler.Interface {
    constructor(private container: Container) {}

    async execute(
        eventCtx: EventContext<EventBridgeEvent<string, any>>,
        _next: NextFunction
    ): Promise<EventBridgeResult> {
        if (eventCtx.event["detail-type"] !== DETAIL_TYPE) {
            return { success: true, message: "Not a bulk action event." };
        }

        await this.container.resolve(TenantContext).withRootTenant(async () => {
            await this.container
                .resolve(TaskService)
                .trigger({ definition: "hcmsEntriesEmptyTrashBins" });
        });

        return { success: true };
    }
}

export const BulkActionsEventBridgeLambdaHandler = EventBridgeEventHandler.createImplementation({
    implementation: BulkActionsEventBridgeLambdaHandlerImpl,
    dependencies: [RequestContainer]
});
