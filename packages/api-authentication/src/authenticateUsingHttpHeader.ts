import { BeforeHandlerPlugin } from "@webiny/api";
import { AuthenticationContext } from "~/types";

export interface GetHeader {
    (headers: Record<string, any>): string | null;
}

const defaultGetHeader: GetHeader = headers => {
    const header = headers["authorization"];

    if (!header) {
        return null;
    }
    return header.split(" ").pop() || null;
};

export const authenticateUsingHttpHeader = (getHeader: GetHeader = defaultGetHeader) => {
    return new BeforeHandlerPlugin<AuthenticationContext>(async context => {
        const { method, headers } = context.request;
        if (method !== "POST") {
            return;
        }

        const token = getHeader(headers);

        if (!token) {
            return;
        }

        await context.authentication.authenticate(token);
    });
};
