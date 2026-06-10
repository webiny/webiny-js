import { HttpEventHandler } from "@webiny/event-handler-core";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { TenantContext } from "~/features/tenancy/TenantContext/abstractions.js";
import type { ITenantContext } from "~/features/tenancy/TenantContext/abstractions.js";

class RootTenantInitializerImpl implements HttpEventHandler.Interface {
    constructor(private tenantCtx: ITenantContext) {}

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
        return next();
    }
}

export const RootTenantInitializer = HttpEventHandler.createImplementation({
    implementation: RootTenantInitializerImpl,
    dependencies: [TenantContext]
});
