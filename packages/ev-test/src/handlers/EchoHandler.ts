import { CloudHandler } from "@cloudi/core";
import type { NextFunction } from "@cloudi/core";
import { TenantContext } from "../context/TenantContext.js";
import type { ITenantContext } from "../context/TenantContext.js";

class EchoHandlerImpl implements CloudHandler.Interface {
    constructor(private tenantCtx: ITenantContext) {}

    private matches(event: any): boolean {
        return event?.method === "POST" && event?.path === "/echo";
    }

    async execute(event: any, next: NextFunction) {
        if (!this.matches(event)) {
            return next();
        }
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: { tenant: this.tenantCtx.require().id, echo: event.body }
        };
    }
}

export const echoHandler = CloudHandler.createImplementation({
    implementation: EchoHandlerImpl,
    dependencies: [TenantContext]
});
