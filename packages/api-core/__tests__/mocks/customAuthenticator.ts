import { ContextPlugin } from "@webiny/api";
import type { ApiCoreContext } from "~/types/core.js";
import { Authenticator } from "~/features/security/authentication/Authenticator/index.js";

export const customAuthenticator = () => {
    return new ContextPlugin<ApiCoreContext>(context => {
        context.container.registerFactory(Authenticator, () => ({
            authenticate: async () => ({
                id: "123456789",
                displayName: "John Doe",
                type: "admin",
                roles: ["full-access"],
                profile: {
                    external: true
                }
            })
        }));
    });
};
