import { createContextPlugin } from "@webiny/api";
import { createBeforeHandlerPlugin, Request } from "@webiny/handler";
import type { ApiCoreContext } from "~/types/core.js";
import { SetIdTokenCookie } from "~/features/security/authentication/AuthenticationContext/SetIdTokenCookie.js";

/**
 * The `wby-id-token` cookie exists only for private file delivery: an `<img src>` cannot send an
 * `Authorization` header. It must not log users in anywhere else, because the browser attaches it
 * to cross-site requests too (`SameSite=None`), which would let any website call the API as the user.
 */
export const isCookieAuthenticationAllowed = (
    request: Pick<Request.Interface, "method" | "url">
) => {
    const method = request.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
        return false;
    }
    return request.url.startsWith("/private/");
};

/**
 * @internal
 */
export function authenticateUsingCookie() {
    return [
        createBeforeHandlerPlugin<ApiCoreContext>(async context => {
            const request = context.container.resolve(Request);
            if (!isCookieAuthenticationAllowed(request)) {
                return;
            }
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
