import { TestHttpEventHandler } from "@webiny/event-handler-core/features/testing";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import type { ITenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";

class TenantFromHeaderInitializerImpl implements TestHttpEventHandler.Interface {
    constructor(
        private tenantCtx: ITenantContext,
        private inner: TestHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        const tenantId: string = ctx.event?.headers?.["x-tenant"] ?? "root";
        this.tenantCtx.setTenant({
            id: tenantId,
            name: tenantId === "root" ? "Root" : tenantId,
            description: "",
            status: "enabled",
            isInstalled: false,
            settings: {
                name: { full: tenantId, slug: tenantId },
                social: {},
                favicon: {},
                logo: {}
            } as any,
            tags: [],
            parent: null,
            createdOn: new Date().toISOString(),
            savedOn: new Date().toISOString()
        });
        return this.inner.execute(ctx, next);
    }
}

export const TenantFromHeaderInitializer = TestHttpEventHandler.createDecorator({
    decorator: TenantFromHeaderInitializerImpl,
    dependencies: [TenantContext]
});
