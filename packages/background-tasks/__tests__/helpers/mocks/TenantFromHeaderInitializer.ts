import { TestHttpInputHandler } from "@webiny/api-kernel-core/features/testing";
import type { InputContext, NextFunction } from "@webiny/api-kernel-core";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import type { ITenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";

class TenantFromHeaderInitializerImpl implements TestHttpInputHandler.Interface {
    constructor(
        private tenantCtx: ITenantContext,
        private inner: TestHttpInputHandler.Interface
    ) {}

    async execute(ctx: InputContext, next: NextFunction): Promise<any> {
        const tenantId: string = ctx.input?.headers?.["x-tenant"] ?? "root";
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

export const TenantFromHeaderInitializer = TestHttpInputHandler.createDecorator({
    decorator: TenantFromHeaderInitializerImpl,
    dependencies: [TenantContext]
});
