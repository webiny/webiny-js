import type { SecurityContext } from "~/types";
import { ContextPlugin } from "@webiny/api";
import type { Context as BaseContext } from "@webiny/handler/types";

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
                groups: ["full-access"]
            };
        });
    });
};
