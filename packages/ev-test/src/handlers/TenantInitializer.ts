import { CloudHandler } from "@cloudi/core";
import type { NextFunction } from "@cloudi/core";
import { TenantContext } from "../context/TenantContext.js";
import type { ITenantContext } from "../context/TenantContext.js";

class TenantInitializerImpl implements CloudHandler.Interface {
    constructor(private ctx: ITenantContext) {}

    async execute(event: any, next: NextFunction) {
        if (!event?.headers) {
            return next();
        }

        const tenantId = event.headers["x-tenant"];
        if (!tenantId) {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: { error: "Missing x-tenant header" }
            };
        }

        this.ctx.set({ id: tenantId });
        return next();
    }
}

export const tenantInitializer = CloudHandler.createImplementation({
    implementation: TenantInitializerImpl,
    dependencies: [TenantContext]
});
