import { HttpContext } from "@webiny/handler-http/types";
import { ContextPlugin } from "@webiny/handler";
import { SecurityContext } from "@webiny/api-security/types";
import { AdminUsersContext } from "~/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { createTenantLinksPermissionsAuthorizer } from "@webiny/api-security/plugins/groupAuthorization";

interface Context extends HttpContext, TenancyContext, SecurityContext, AdminUsersContext {}

interface Options {
    fullAccess?: boolean;
}

export const customAuthorizer = (opts: Options) => {
    return new ContextPlugin<Context>(context => {
        const groupAuthorizer = createTenantLinksPermissionsAuthorizer({ identityType: "admin" })(context);
        context.security.addAuthorizer(async () => {
            if (opts.fullAccess) {
                return [{ name: "*" }];
            }

            return groupAuthorizer();
        });
    });
};
