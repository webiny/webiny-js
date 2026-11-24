import { TestHttpInputHandler } from "@webiny/kernel-core/features/testing";
import type { InputContext, NextFunction } from "@webiny/kernel-core";
import { TenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import type { ITenantContext } from "~/features/tenancy/TenantContext/abstractions.js";

class RootTenantInitializerImpl implements TestHttpInputHandler.Interface {
    constructor(
        private tenantCtx: ITenantContext,
        private inner: TestHttpInputHandler.Interface
    ) {}

    async execute(ctx: InputContext, next: NextFunction): Promise<any> {
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

export const RootTenantInitializer = TestHttpInputHandler.createDecorator({
    decorator: RootTenantInitializerImpl,
    dependencies: [TenantContext]
});
