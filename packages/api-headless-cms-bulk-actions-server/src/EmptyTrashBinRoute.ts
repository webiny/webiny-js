import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
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

    public async handle(request: IHttpRequest): Promise<IHttpResponse> {
        if (request.headers[INTERNAL_HEADER] !== this.internalToken.value) {
            return {
                statusCode: 403,
                body: {
                    error: "Forbidden."
                }
            };
        }

        try {
            await this.tenantContext.withRootTenant(async () => {
                await this.taskService.trigger({ definition: "hcmsEntriesEmptyTrashBins" });
            });

            return {
                statusCode: 200,
                headers: { "content-type": "application/json" },
                body: { status: "ok" }
            };
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`Empty trash bin route error: ${message}`);
            return { statusCode: 500, body: { status: "error", error: { message } } };
        }
    }
}

export const EmptyTrashBinRoute = HttpRoute.createImplementation({
    implementation: EmptyTrashBinRouteImpl,
    dependencies: [TenantContext, TaskService, BulkActionsInternalToken]
});
