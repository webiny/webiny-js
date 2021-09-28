import { BeforeHandlerPlugin } from "@webiny/handler/plugins/BeforeHandlerPlugin";
import { Context } from "@webiny/handler/types";

export interface GetHeader {
    (context: Context): string;
}

const defaultGetHeader: GetHeader = context => {
    const { headers } = context.http.request;

    const header = headers["Authorization"] || headers["authorization"];

    return header ? header.split(" ").pop() : null;
};

export const authenticateUsingHttpHeader = (getHeader: GetHeader = defaultGetHeader) => {
    return new BeforeHandlerPlugin<Context>(async context => {
        const token = getHeader(context);

        if (!token) {
            return;
        }

        await context.authentication.authenticate(token);
    });
};
