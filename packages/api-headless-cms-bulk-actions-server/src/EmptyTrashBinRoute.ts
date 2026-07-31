import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { HttpRoute, RequestContainer } from "@webiny/event-handler-core";
import type { Container } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/abstractions.js";
import { BulkActionsInternalToken } from "./BulkActionsInternalToken.js";

const INTERNAL_HEADER = "x-webiny-bulk-actions-token";

class EmptyTrashBinRouteImpl implements HttpRoute.Interface {
    public readonly method = "POST";
    public readonly path = "/empty-trash-bins";

    public constructor(
        private readonly container: Container,
        private readonly internalToken: BulkActionsInternalToken.Interface
    ) {}

    public async handle(request: IHttpRequest): Promise<IHttpResponse> {
        if (request.headers[INTERNAL_HEADER] !== this.internalToken.value) {
            return { statusCode: 403, body: { error: "Forbidden." } };
        }

        try {
            await this.container.resolve(TenantContext).withRootTenant(async () => {
                await this.container
                    .resolve(TaskService)
                    .trigger({ definition: "hcmsEntriesEmptyTrashBins" });
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
    dependencies: [RequestContainer, BulkActionsInternalToken]
});
