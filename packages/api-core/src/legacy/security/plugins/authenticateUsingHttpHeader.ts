import { createBeforeHandlerPlugin, Request } from "@webiny/handler";
import { authenticateUsingCookie } from "./authenticateUsingCookie.js";
import type { ApiCoreContext } from "~/types/core.js";
import { setupSecureHeaders } from "./secureHeaders.js";

export interface GetHeader {
    (context: ApiCoreContext): string | null | undefined;
}

const getHeader: GetHeader = context => {
    const request = context.container.resolve(Request);
    const header = request.headers["authorization"];

    return header ? header.split(" ").pop() : null;
};

export const authenticateUsingHttpHeader = () => {
    return [
        createBeforeHandlerPlugin<ApiCoreContext>(async context => {
            const token = getHeader(context);

            if (!token) {
                return;
            }

            await context.security.authenticate(token);
        }),
        // Configure strict headers (this is also a requirement to use cookies).
        setupSecureHeaders(),
        // Finally, we add cookie-based authentication.
        authenticateUsingCookie()
    ];
};
