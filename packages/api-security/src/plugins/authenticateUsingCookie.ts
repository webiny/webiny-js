import jwt from "jsonwebtoken";
import { createContextPlugin } from "@webiny/api";
import { createBeforeHandlerPlugin } from "@webiny/handler";
import { SecurityContext } from "~/types";

const get24HoursFromNow = () => {
    const oneHour = 1000 * 60 * 60;
    return new Date(new Date().getTime() + oneHour * 24);
};

const toDate = (timestamp: number | undefined) => {
    return timestamp ? new Date(timestamp * 1000) : get24HoursFromNow();
};

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
            context.security.onLogin.subscribe(() => {
                const token = context.security.getToken();

                if (!token) {
                    return;
                }

                // Attempt to acquire expiration from the token; fall back to "expire in 24 hours".
                // In most cases the token will be a JWT token, but it can also be a custom token, or an API key.
                const tokenData = jwt.decode(token, { json: true });
                const expiresOn = tokenData ? toDate(tokenData.exp) : get24HoursFromNow();

                // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
                context.reply.setCookie("wby-id-token", token, {
                    path: "/",
                    expires: expiresOn,
                    // Allow this cookie to be sent with cross-origin requests.
                    sameSite: "none",
                    // Only send this cookie to the server when HTTPS is used.
                    // NOTE: `https` requirement is ignored for `localhost.
                    secure: true,
                    // Forbids JavaScript from accessing the cookie.
                    httpOnly: true
                });

                context.reply.header("cache-control", `no-cache="Set-Cookie"`);
            });
        })
    ];
}
