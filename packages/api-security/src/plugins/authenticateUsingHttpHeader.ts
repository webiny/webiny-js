import { createBeforeHandlerPlugin } from "@webiny/handler";
import { Context as BaseContext } from "@webiny/handler/types";
import { createContextPlugin } from "@webiny/api";
import { authenticateUsingCookie } from "./authenticateUsingCookie";
import { SecurityContext } from "~/types";
import { setupSecureHeaders } from "~/plugins/secureHeaders";

type Context = BaseContext & SecurityContext;

export interface GetHeader {
    (context: Context): string | null | undefined;
}

const defaultGetHeader: GetHeader = context => {
    const header = context.request.headers["authorization"];

    return header ? header.split(" ").pop() : null;
};

export const authenticateUsingHttpHeader = (getHeader: GetHeader = defaultGetHeader) => {
    return [
        createContextPlugin<SecurityContext>(context => {
            context.plugins.register(
                createBeforeHandlerPlugin<Context>(async context => {
                    const token = getHeader(context);

                    if (!token) {
                        return;
                    }

                    await context.security.authenticate(token);
                })
            );

            if (context.wcp.canUsePrivateFiles()) {
                authenticateUsingCookie(context);
            }
        }),
        // To use cookies, we must tighten the setup of headers.
        setupSecureHeaders()
    ];
};
