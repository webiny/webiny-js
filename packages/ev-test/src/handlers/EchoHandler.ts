import { HttpRoute } from "@webiny/event-handler";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler";
import { TenantContext } from "../context/TenantContext.js";
import type { ITenantContext } from "../context/TenantContext.js";

class EchoHandlerImpl implements HttpRoute.Interface {
    readonly method = "POST";
    readonly path = "/echo";

    constructor(private tenantCtx: ITenantContext) {}

    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: { tenant: this.tenantCtx.require().id, echo: request.body }
        };
    }
}

export const echoHandler = HttpRoute.createImplementation({
    implementation: EchoHandlerImpl,
    dependencies: [TenantContext]
});
