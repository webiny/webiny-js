import { ContextPlugin } from "@webiny/handler";
import type { ApiCoreContext } from "~/types/core.js";

export const customAuthenticator = () => {
    return new ContextPlugin<ApiCoreContext>(context => {
        context.security.addAuthenticator(async () => {
            return {
                id: "123456789",
                displayName: "John Doe",
                type: "admin",
                roles: ["full-access"]
            };
        });
    });
};
