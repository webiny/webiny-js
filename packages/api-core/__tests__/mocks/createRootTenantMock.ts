import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "~/types/core.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import type { Tenant } from "~/types/tenancy.js";

export const createRootTenantMock = () => {
    return new ContextPlugin<ApiCoreContext>(context => {
        context.container.resolve(TenantContext).setTenant({
            id: "root",
            name: "Root",
            isInstalled: true,
            parent: null,
            tags: []
        } as unknown as Tenant);
    });
};
