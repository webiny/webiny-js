import { HttpContext } from "@webiny/handler-http/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import { SecurityContext } from "@webiny/api-security/types";
import { AdminUsersContext } from "~/types";

interface Context extends HttpContext, SecurityContext, AdminUsersContext {}

export const customAuthenticator = () => {
    return new ContextPlugin<Context>(context => {
        context.security.addAuthenticator(async () => {
            return {
                id: "12345678",
                type: "admin",
                displayName: "John Doe"
            };
        });

        // We need to set an exact user ID to match the Identity ID
        context.adminUsers.onUserBeforeCreate.subscribe(({ user }) => {
            if (user.email === "admin@webiny.com") {
                user.id = "12345678";
            }
        });
    });
};
