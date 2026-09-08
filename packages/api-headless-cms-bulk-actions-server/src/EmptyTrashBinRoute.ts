import { HttpRouteDefinition, HttpRouteHandler } from "@webiny/event-handler-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/abstractions.js";
import { BulkActionsInternalToken } from "./BulkActionsInternalToken.js";

const INTERNAL_HEADER = "x-webiny-bulk-actions-token";

class EmptyTrashBinRouteImpl implements HttpRouteHandler.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly taskService: TaskService.Interface,
        private readonly internalToken: BulkActionsInternalToken.Interface
    ) {}

    public async handle(request: HttpRouteHandler.Request, response: HttpRouteHandler.Response) {
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

class EmptyTrashBinRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly method = "POST";
    readonly path = "/empty-trash-bins";
    readonly handler = EmptyTrashBinRoute;
}

/** What the router matches on. Zero dependencies, so building it costs nothing. */
export const EmptyTrashBinRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: EmptyTrashBinRouteDefinitionImpl,
    dependencies: []
});
