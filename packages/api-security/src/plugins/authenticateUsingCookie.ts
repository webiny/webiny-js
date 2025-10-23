import { createContextPlugin } from "@webiny/api";
import { createBeforeHandlerPlugin } from "@webiny/handler";
import type { SecurityContext } from "~/types.js";
import { SetIdTokenCookie } from "~/features/authentication/SetIdTokenCookie.js";


/**
 * @internal
 */
export function authenticateUsingCookie() {
    return [
        createBeforeHandlerPlugin<SecurityContext>(async context => {
            const { cookies } = context.request;
            const token = cookies["wby-id-token"];

            if (!context.security.getIdentity() && token) {
                try {
                    await context.security.authenticate(token);
                } catch (err) {
                    console.log(err);
                }
            }
        }),

        createContextPlugin<SecurityContext>(context => {
            context.container.register(SetIdTokenCookie);
        })
    ];
}
