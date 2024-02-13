import { ErrorResponse, ListErrorResponse, ListResponse, Response } from "@webiny/handler-graphql";

export const resolve = async (fn: () => Promise<any>) => {
    try {
        return new Response(await fn());
    } catch (ex) {
        return new ErrorResponse(ex);
    }
};

export const resolveList = async (fn: () => Promise<any>) => {
    try {
        const result = await fn();
        return new ListResponse(result.items, result.meta);
    } catch (ex) {
        return new ListErrorResponse(ex);
    }
};
