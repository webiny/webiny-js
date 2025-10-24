import jwt from "jsonwebtoken";
import { createImplementation } from "@webiny/feature/api";
import { Reply } from "@webiny/handler";
import { AfterAuthenticationHandler } from "~/features/authentication/AuthenticationContext/index.js";
import { AuthenticationContext } from "~/features/authentication/AuthenticationContext/index.js";

const get24HoursFromNow = () => {
    const oneHour = 1000 * 60 * 60;
    return new Date(new Date().getTime() + oneHour * 24);
};

const toDate = (timestamp: number | undefined) => {
    return timestamp ? new Date(timestamp * 1000) : get24HoursFromNow();
};

class SetIdTokenCookieImpl implements AfterAuthenticationHandler.Interface {
    constructor(
        private authenticationContext: AuthenticationContext.Interface,
        private reply: Reply.Interface
    ) {}

    async handle(): Promise<void> {
        const token = this.authenticationContext.getAuthToken();

        if (!token) {
            return;
        }

        // Attempt to acquire expiration from the token; fall back to "expire in 24 hours".
        // In most cases the token will be a JWT token, but it can also be a custom token, or an API key.
        const tokenData = jwt.decode(token, { json: true });
        const expiresOn = tokenData ? toDate(tokenData.exp) : get24HoursFromNow();

        // @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
        this.reply.setCookie("wby-id-token", token, {
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

        this.reply.header("cache-control", `no-cache="Set-Cookie"`);
    }
}

export const SetIdTokenCookie = createImplementation({
    abstraction: AfterAuthenticationHandler,
    implementation: SetIdTokenCookieImpl,
    dependencies: [AuthenticationContext, Reply]
});
