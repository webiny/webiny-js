import { SecurityContext } from "@webiny/api-security/types";
import { HttpContext } from "@webiny/handler-http/types";
import { ContextPlugin } from "@webiny/handler";

interface Context extends HttpContext, SecurityContext {}

export const customAuthenticator = () => {
    return new ContextPlugin<Context>(context => {
        context.security.addAuthenticator(async () => {
            return {
                id: "123456789",
                displayName: "John Doe",
                type: "admin",
                group: "full-access"
            };
        });
    });
};
