import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerHttpContext } from "@webiny/handler-http/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { HandlerTenancyContext, Tenant } from "../types";
import tenantsCrud from "./crud/tenants.crud";

const tenantCache = {};

const getCurrentTenant = async (context): Promise<Tenant> => {
    const { headers = {} } = context.http;

    const tenantId = headers["X-Tenant"] ?? "default";

    if (!tenantCache[tenantId]) {
        tenantCache[tenantId] = await context.tenancy.crud.getById(tenantId);
    }

    return tenantCache[tenantId];
};

export default {
    type: "context",
    apply: async context => {
        let tenant = null;
        context.tenancy = {
            withTenantId(value) {
                return `T#${this.getTenant().id}#${value}`;
            },
            getTenant() {
                return tenant;
            },
            crud: tenantsCrud(context)
        };

        tenant = await getCurrentTenant(context);
    }
} as HandlerContextPlugin<HandlerHttpContext, HandlerTenancyContext, HandlerContextDb>;
