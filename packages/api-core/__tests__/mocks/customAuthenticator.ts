import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "~/types/core.js";

export const customAuthenticator = () => {
    return new ContextPlugin<ApiCoreContext>(context => {
        context.security.addAuthenticator(async () => {
            if ("authorization" in context.request.headers) {
                return null;
            }

            return {
                id: "123456789",
                displayName: "John Doe",
                type: "admin",
                roles: ["full-access"],
                profile: {
                    external: true
                }
            };
        });
    });
};
