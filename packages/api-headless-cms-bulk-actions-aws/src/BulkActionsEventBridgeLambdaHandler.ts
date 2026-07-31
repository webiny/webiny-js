import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import {
    EventBridgeEventHandler,
    type EventBridgeResult
} from "@webiny/event-handler-aws/abstractions/handlers/EventBridgeEventHandler.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/abstractions.js";
import type { EventContext } from "@webiny/event-handler-core";

const DETAIL_TYPE = "WebinyEmptyTrashBin";

class BulkActionsEventBridgeLambdaHandlerImpl implements EventBridgeEventHandler.Interface {
    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly taskService: TaskService.Interface
    ) {}

    async execute(
        eventCtx: EventContext<EventBridgeEvent<string, any>>
    ): Promise<EventBridgeResult> {
        if (eventCtx.event["detail-type"] !== DETAIL_TYPE) {
            return {
                success: true,
                message: "Not a bulk action event."
            };
        }

        await this.tenantContext.withRootTenant(async () => {
            return await this.taskService.trigger({
                definition: "hcmsEntriesEmptyTrashBins"
            });
        });

        return { success: true };
    }
}

export const BulkActionsEventBridgeLambdaHandler = EventBridgeEventHandler.createImplementation({
    implementation: BulkActionsEventBridgeLambdaHandlerImpl,
    dependencies: [TenantContext, TaskService]
});
