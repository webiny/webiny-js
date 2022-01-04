import { BeforeHandlerPlugin } from "@webiny/handler";
import { SecurityContext } from "~/types";
import { HttpContext } from "@webiny/handler-http/types";

type Context = HttpContext & SecurityContext;

export interface GetHeader {
    (context: Context): string;
}

const defaultGetHeader: GetHeader = context => {
    const { headers } = context.http.request;

    const header = headers["authorization"];

    return header ? header.split(" ").pop() : null;
};

export const authenticateUsingHttpHeader = (getHeader: GetHeader = defaultGetHeader) => {
    return new BeforeHandlerPlugin<Context>(async context => {
        const { method } = context.http.request;
        if (method !== "POST") {
            return;
        }

        const token = getHeader(context);

        if (!token) {
            return;
        }

        await context.security.authenticate(token);
    });
};
