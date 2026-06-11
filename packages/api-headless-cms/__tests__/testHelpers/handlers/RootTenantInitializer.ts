import { TestHttpEventHandler } from "@webiny/event-handler-core/testing";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import type { ITenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";

class RootTenantInitializerImpl implements TestHttpEventHandler.Interface {
    constructor(
        private tenantCtx: ITenantContext,
        private inner: TestHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext, next: NextFunction): Promise<any> {
        this.tenantCtx.setTenant({
            id: "root",
            name: "Root",
            description: "",
            status: "enabled",
            isInstalled: false,
            settings: {
                name: { full: "Root", slug: "root" },
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

export const RootTenantInitializer = TestHttpEventHandler.createDecorator({
    decorator: RootTenantInitializerImpl,
    dependencies: [TenantContext]
});
