import { HttpContext } from "@webiny/handler-http/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { GroupTenantLink, SecurityContext } from "@webiny/api-security/types";
import { AdminUsersContext } from "~/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

interface Context extends HttpContext, TenancyContext, SecurityContext, AdminUsersContext {}

interface Options {
    fullAccess?: boolean;
}

export const customAuthorizer = (opts: Options) => {
    return new ContextPlugin<Context>(context => {
        context.security.addAuthorizer(async () => {
            if (opts.fullAccess) {
                return [{ name: "*" }];
            }

            const tenant = context.tenancy.getCurrentTenant();
            const identity = context.security.getIdentity();

            if (!identity) {
                return null;
            }

            const link = await context.security.getTenantLinkByIdentity<GroupTenantLink>({
                identity: identity.id,
                tenant: tenant.id
            });

            if (!link) {
                return null;
            }

            return link.data.permissions;
        });
    });
};
