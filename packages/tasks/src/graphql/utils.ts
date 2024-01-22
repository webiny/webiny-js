import { ErrorResponse, ListErrorResponse, ListResponse, Response } from "@webiny/handler-graphql";
import { CmsEntryMeta } from "@webiny/api-headless-cms/types";

export const emptyResolver = () => ({});

interface ResolveCallable<T = any> {
    (): Promise<T>;
}

export const resolve = async <T = any>(fn: ResolveCallable<T>) => {
    try {
        return new Response(await fn());
    } catch (e) {
        return new ErrorResponse(e);
    }
};

interface IListResult {
    items: any[];
    meta: CmsEntryMeta;
}

export const resolveList = async (fn: ResolveCallable) => {
    try {
        const result = (await fn()) as IListResult;
        return new ListResponse(result.items, result.meta);
    } catch (e) {
        return new ListErrorResponse(e);
    }
};
