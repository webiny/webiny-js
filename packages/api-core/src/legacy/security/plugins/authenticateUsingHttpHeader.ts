import { createBeforeHandlerPlugin } from "@webiny/handler";
import { authenticateUsingCookie } from "./authenticateUsingCookie.js";
import type { ApiCoreContext } from "~/types/core.js";
import { setupSecureHeaders } from "./secureHeaders.js";

export interface GetHeader {
    (context: ApiCoreContext): string | null | undefined;
}

const defaultGetHeader: GetHeader = context => {
    const header = context.request.headers["authorization"];

    return header ? header.split(" ").pop() : null;
};

export const authenticateUsingHttpHeader = (getHeader: GetHeader = defaultGetHeader) => {
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
