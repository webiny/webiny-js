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
        const [items, meta] = await fn();
        return new ListResponse(items, meta);
    } catch (e) {
        return new ErrorResponse(e);
    }
};
