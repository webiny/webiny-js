import { HttpContext } from "@webiny/handler-http/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "@webiny/api-security/types";
import { BeforeHandlerPlugin } from "@webiny/handler/plugins/BeforeHandlerPlugin";

interface Context extends HttpContext, SecurityContext {}

export const customAuthenticator = () => {
    return [
        new ContextPlugin<Context>(context => {
            context.security.addAuthenticator(async () => {
                return {
                    id: "12345678",
                    type: "admin",
                    displayName: "John Doe"
                };
            });
        }),
        new BeforeHandlerPlugin<Context>(async context => {
            await context.security.authenticate("");
        })
    ];
};
