import { HttpContext } from "@webiny/handler-http/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-tenancy/types";

interface Context extends HttpContext, TenancyContext, SecurityContext {}

export const customAuthorizer = () => {
    return new ContextPlugin<Context>(context => {
        context.security.addAuthorizer(async () => {
            return [{ name: "*" }];
        });
    });
};
