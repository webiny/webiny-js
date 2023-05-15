import { ErrorResponse, ListResponse, Response } from "@webiny/handler-graphql";

export const resolve = async (fn: () => Promise<any>) => {
    try {
        return new Response(await fn());
    } catch (e) {
        return new ErrorResponse(e);
    }
};
export const resolveList = async (fn: () => Promise<any>) => {
    try {
        const [entries, meta] = await fn();
        return new ListResponse(entries, meta);
    } catch (e) {
        return new ErrorResponse(e);
    }
};
