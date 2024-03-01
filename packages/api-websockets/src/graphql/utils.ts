import { ErrorResponse, Response } from "@webiny/handler-graphql";

export const emptyResolver = () => ({});

interface ResolveCallable<T = any> {
    (): Promise<T>;
}

export const resolve = async <T = any>(fn: ResolveCallable<T>) => {
    try {
        return new Response(await fn());
    } catch (ex) {
        return new ErrorResponse(ex);
    }
};
