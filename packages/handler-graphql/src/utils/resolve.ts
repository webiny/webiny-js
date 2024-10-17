import { ErrorResponse, ListErrorResponse, ListResponse, Response } from "~/responses";
import { GenericRecord } from "@webiny/api/types";

export interface Meta {
    totalCount: number;
    hasMoreItems: boolean;
    cursor: string | null;
}

export const emptyResolver = () => ({});

interface ResolveCallable<T = GenericRecord> {
    (): Promise<T>;
}

export const resolve = async <T = GenericRecord>(fn: ResolveCallable<T>) => {
    try {
        return new Response(await fn());
    } catch (ex) {
        return new ErrorResponse(ex);
    }
};

interface ResolveListCallable<T> {
    (): Promise<IListResult<T>>;
}

interface IListResult<T = GenericRecord> {
    items: T[];
    meta: Meta;
}

export const resolveList = async <T = GenericRecord>(fn: ResolveListCallable<T>) => {
    try {
        const result = (await fn()) as IListResult<T>;
        return new ListResponse(result.items, result.meta);
    } catch (ex) {
        return new ListErrorResponse(ex);
    }
};
