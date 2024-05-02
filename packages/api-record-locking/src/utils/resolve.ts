import { ErrorResponse, ListErrorResponse, ListResponse, Response } from "@webiny/handler-graphql";
import { IRecordLockingMeta } from "~/types";

export const resolve = async <T>(cb: () => Promise<T>): Promise<Response<T> | ErrorResponse> => {
    try {
        const result = await cb();
        return new Response<T>(result);
    } catch (ex) {
        return new ErrorResponse(ex);
    }
};

export interface IListResponse<T> {
    items: T[];
    meta: IRecordLockingMeta;
}

export const resolveList = async <T>(
    cb: () => Promise<IListResponse<T>>
): Promise<Response<T[]> | ErrorResponse> => {
    try {
        const { items, meta } = await cb();
        return new ListResponse(items, meta);
    } catch (ex) {
        return new ListErrorResponse(ex);
    }
};
