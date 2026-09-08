import { HttpRoute, HttpRouteDefinition, HttpRouteHandler } from "@webiny/event-handler-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/abstractions.js";
import { BulkActionsInternalToken } from "./BulkActionsInternalToken.js";

const INTERNAL_HEADER = "x-webiny-bulk-actions-token";

class EmptyTrashBinRouteImpl implements HttpRoute.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly taskService: TaskService.Interface,
        private readonly internalToken: BulkActionsInternalToken.Interface
    ) {}

    public async handle(request: HttpRoute.Request, response: HttpRoute.Response) {
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

export const EmptyTrashBinRoute = HttpRouteHandler.createImplementation({
    implementation: EmptyTrashBinRouteImpl,
    dependencies: [TenantContext, TaskService, BulkActionsInternalToken]
});

/** What the router matches on. Plain data — reading it builds nothing. */
export const EmptyTrashBinRouteDefinition: HttpRouteDefinition.Interface = {
    method: "POST",
    path: "/empty-trash-bins",
    handler: EmptyTrashBinRoute
};
