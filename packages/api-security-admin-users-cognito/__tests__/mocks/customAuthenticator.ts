import { HttpContext } from "@webiny/handler-http/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "@webiny/api-security/types";

interface Context extends HttpContext, SecurityContext {}

export const customAuthenticator = () => {
    return new ContextPlugin<Context>(context => {
        context.security.addAuthenticator(async () => {
            if ("authorization" in context.http.request.headers) {
                return;
            }

            return {
                id: "admin@webiny.com",
                type: "admin",
                displayName: "John Doe",
                firstName: "John",
                lastName: "Doe",
                group: "full-access"
            };
        });
    });
};
