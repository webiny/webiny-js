import type { IHttpRequest, IHttpResponseBuilder } from "@webiny/event-handler-core";
import { HttpRoute } from "@webiny/event-handler-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/abstractions.js";
import { BulkActionsInternalToken } from "./BulkActionsInternalToken.js";

const INTERNAL_HEADER = "x-webiny-bulk-actions-token";

class EmptyTrashBinRouteImpl implements HttpRoute.Interface {
    public readonly method = "POST";
    public readonly path = "/empty-trash-bins";

    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly taskService: TaskService.Interface,
        private readonly internalToken: BulkActionsInternalToken.Interface
    ) {}

    public async handle(request: IHttpRequest, response: IHttpResponseBuilder) {
        if (request.headers[INTERNAL_HEADER] !== this.internalToken.value) {
            return response.status(403).json({ error: "Forbidden." });
        }

        try {
            await this.tenantContext.withRootTenant(async () => {
                await this.taskService.trigger({ definition: "hcmsEntriesEmptyTrashBins" });
            });

            return response.json({ status: "ok" });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`Empty trash bin route error: ${message}`);
            return response.status(500).json({ status: "error", error: { message } });
        }
    }
}

export const EmptyTrashBinRoute = HttpRoute.createImplementation({
    implementation: EmptyTrashBinRouteImpl,
    dependencies: [TenantContext, TaskService, BulkActionsInternalToken]
});
