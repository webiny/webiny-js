import { ErrorResponse, Response } from "@webiny/handler-graphql";

export const resolve = async <T>(cb: () => Promise<T>): Promise<Response<T> | ErrorResponse> => {
    try {
        const result = await cb();
        return new Response<T>(result);
    } catch (ex) {
        return new ErrorResponse(ex);
    }
};
