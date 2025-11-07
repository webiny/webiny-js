import { createContextPlugin } from "@webiny/api";
import { createBeforeHandlerPlugin, Request } from "@webiny/handler";
import type { ApiCoreContext } from "~/types/core.js";
import { SetIdTokenCookie } from "~/features/security/authentication/AuthenticationContext/SetIdTokenCookie.js";

/**
 * @internal
 */
export function authenticateUsingCookie() {
    return [
        createBeforeHandlerPlugin<ApiCoreContext>(async context => {
            const request = context.container.resolve(Request);
            const { cookies } = request;
            const token = cookies["wby-id-token"];

            if (!context.security.getIdentity() && token) {
                try {
                    await context.security.authenticate(token);
                } catch (err) {
                    console.log(err);
                }
            }
        }),

        createContextPlugin<ApiCoreContext>(context => {
            context.container.register(SetIdTokenCookie);
        })
    ];
}
