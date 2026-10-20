import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/abstractions.js";
import { EmptyTrashBinsEventHandler } from "./EmptyTrashBinsEventHandler.js";

/**
 * Starts the task that empties the trash bins, as the root tenant. The task does the work; this
 * only triggers it. Mirrors `BulkActionsEventBridgeLambdaHandler` on AWS.
 */
class TriggerEmptyTrashBinsHandlerImpl implements EmptyTrashBinsEventHandler.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly taskService: TaskService.Interface
    ) {}

    public async execute(): Promise<void> {
        await this.tenantContext.withRootTenant(async () => {
            await this.taskService.trigger({ definition: "hcmsEntriesEmptyTrashBins" });
        });
    }
}

export const TriggerEmptyTrashBinsHandler = EmptyTrashBinsEventHandler.createImplementation({
    implementation: TriggerEmptyTrashBinsHandlerImpl,
    dependencies: [TenantContext, TaskService]
});
