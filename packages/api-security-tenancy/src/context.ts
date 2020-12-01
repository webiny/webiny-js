import { SecurityContext } from "@webiny/api-security/types";
import { ContextPlugin } from "@webiny/handler/types";
import { HttpContext } from "@webiny/handler-http/types";
import { DbContext } from "@webiny/handler-db/types";
import { TenancyContext, Tenant } from "./types";
import tenantCrud from "./crud/tenants.crud";
import userCrud from "./crud/users.crud";
import groupCrud from "./crud/groups.crud";

type Context = HttpContext & SecurityContext & TenancyContext & DbContext;

const tenantCache = {};

const getCurrentTenant = async (context: Context): Promise<Tenant> => {
    const { headers = {} } = context.http;

    const tenantId = headers["X-Tenant"] ?? "root";

    if (!tenantCache[tenantId]) {
        tenantCache[tenantId] = await context.security.tenants.getTenant(tenantId);
    }

    return tenantCache[tenantId];
};

export default {
    type: "context",
    apply: async context => {
        let __tenant = null;

        if(!context.security) {
            // @ts-ignore
            context.security = {};
        }

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
} as ContextPlugin<Context>;
