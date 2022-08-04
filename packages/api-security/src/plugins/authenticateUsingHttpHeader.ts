import { BeforeHandlerPlugin } from "@webiny/api";
import { SecurityContext } from "~/types";
import { Context as BaseContext } from "@webiny/handler/types";

type Context = BaseContext & SecurityContext;

export interface GetHeader {
    (context: Context): string | null | undefined;
}

const defaultGetHeader: GetHeader = context => {
    const header = context.request.headers["authorization"];

    return header ? header.split(" ").pop() : null;
};

export const authenticateUsingHttpHeader = (getHeader: GetHeader = defaultGetHeader) => {
    return new BeforeHandlerPlugin<Context>(async context => {
        const { method } = context.request;
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
