import { Response, ErrorResponse } from "@webiny/handler-graphql";

export const emptyResolver = () => ({});

/**
 * Use any because it really can be any.
 */
interface ResolveCallable {
    (): Promise<any>;
}

export const resolve = async (fn: ResolveCallable) => {
    try {
        return new Response(await fn());
    } catch (e) {
        return new ErrorResponse(e);
    }
};
