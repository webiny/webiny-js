import { HandlerSecurityContext } from "@webiny/api-security/types";
import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerHttpContext } from "@webiny/handler-http/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { HandlerTenancyContext, Tenant } from "./types";
import tenantCrud from "./crud/tenants.crud";
import userCrud from "./crud/users.crud";
import groupCrud from "./crud/groups.crud";

const tenantCache = {};

const getCurrentTenant = async (context): Promise<Tenant> => {
    const { headers = {} } = context.http;

    const tenantId = headers["X-Tenant"] ?? "default";

    if (!tenantCache[tenantId]) {
        tenantCache[tenantId] = await context.security.tenant.getTenant(tenantId);
    }

    return tenantCache[tenantId];
};

export default {
    type: "context",
    apply: async context => {
        let __tenant = null;

        context.security.getTenant = () => {
            return __tenant;
        };

        context.security.setTenant = (tenant: Tenant) => {
            if (!__tenant) {
                __tenant = tenant;
            }
        };

        context.security.tenants = tenantCrud(context);
        context.security.users = userCrud(context);
        context.security.groups = groupCrud(context);

        __tenant = await getCurrentTenant(context);
    }
} as HandlerContextPlugin<
    HandlerHttpContext,
    HandlerSecurityContext,
    HandlerTenancyContext,
    HandlerContextDb
>;
