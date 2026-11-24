import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import {
    EventBridgeInputHandler,
    type EventBridgeResult
} from "@webiny/kernel-aws/abstractions/handlers/EventBridgeInputHandler.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/abstractions.js";
import type { InputContext } from "@webiny/kernel-core";

const DETAIL_TYPE = "WebinyEmptyTrashBin";

class BulkActionsEventBridgeLambdaHandlerImpl implements EventBridgeInputHandler.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly taskService: TaskService.Interface
    ) {}

    public async execute(
        inputCtx: InputContext<EventBridgeEvent<string, any>>
    ): Promise<EventBridgeResult> {
        if (inputCtx.input["detail-type"] !== DETAIL_TYPE) {
            return {
                success: true,
                message: "Not a bulk action event."
            };
        }

        const result = await this.tenantContext.withRootTenant(async () => {
            return await this.taskService.trigger({
                definition: "hcmsEntriesEmptyTrashBins"
            });
        });
        if (result.isFail()) {
            return {
                success: false,
                message: result.error.message
            };
        }

        return { success: true };
    }
}

export const BulkActionsEventBridgeLambdaHandler = EventBridgeInputHandler.createImplementation({
    implementation: BulkActionsEventBridgeLambdaHandlerImpl,
    dependencies: [TenantContext, TaskService]
});
