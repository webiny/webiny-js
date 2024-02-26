import { SecurityContext } from "~/types";
import { ContextPlugin } from "@webiny/api";
import { Context as BaseContext } from "@webiny/handler/types";

interface Context extends BaseContext, SecurityContext {}

export const customAuthenticator = () => {
    return new ContextPlugin<Context>(context => {
        context.security.addAuthenticator(async () => {
            if ("authorization" in context.request.headers) {
                return null;
            }

            return {
                id: "123456789",
                displayName: "John Doe",
                type: "admin",
                group: "full-access"
            };
        });
    });
};
