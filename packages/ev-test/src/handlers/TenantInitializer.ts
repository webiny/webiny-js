import { HttpEventHandler } from "@webiny/event-handler";
import type { EventContext, NextFunction } from "@webiny/event-handler";
import { TenantContext } from "../context/TenantContext.js";
import type { ITenantContext } from "../context/TenantContext.js";

class TenantInitializerImpl implements HttpEventHandler.Interface {
    constructor(private ctx: ITenantContext) {}

    async execute(ctx: EventContext, next: NextFunction) {
        if (!ctx.event?.headers) {
            return next();
        }

        const tenantId = ctx.event.headers["x-tenant"];
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

export const tenantInitializer = HttpEventHandler.createImplementation({
    implementation: TenantInitializerImpl,
    dependencies: [TenantContext]
});
