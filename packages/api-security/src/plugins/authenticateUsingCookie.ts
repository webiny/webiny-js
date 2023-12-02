import { createBeforeHandlerPlugin } from "@webiny/handler";
import { SecurityContext } from "~/types";

/**
 * @internal
 */
export function authenticateUsingCookie(context: SecurityContext) {
    context.plugins.register(
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
        })
    );

    context.security.onLogin.subscribe(() => {
        const currentDate = new Date();

        const token = context.security.getToken();

        if (!token) {
            return;
        }

        // TODO: this should be extracted from the idToken (`exp` claim).
        // TODO: For API Keys, we don't want to set the cookie at all.
        const hours = 1000 * 60 * 60 * 24;
        const expiresOn = new Date(currentDate.getTime() + hours);

        // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
        // `https` requirement is ignored for `localhost`, so it is safe to set `secure: true`.
        context.reply.setCookie("wby-id-token", token, {
            path: "/",
            expires: expiresOn,
            // Allow this cookie to be sent with cross-origin requests.
            sameSite: "none",
            // Only send this cookie to the server when HTTPS is used.
            secure: true,
            // Forbids JavaScript from accessing the cookie.
            httpOnly: true
        });
    });
}
