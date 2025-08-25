import type { IAuditLog } from "~/storage/types.js";
import type { EntityQueryOptions } from "@webiny/db-dynamodb/toolbox.js";
import { createStartKey } from "~/storage/startKey.js";
import type { IStorageListParams, IStorageListSuccessResult } from "../abstractions/Storage.js";
import type {
    IAccessPattern,
    IAccessPatternCreateKeysResult
} from "../abstractions/AccessPattern.js";

export interface ICreateOptionsParams {
    index: string | undefined;
    order: "ASC" | "DESC" | undefined;
    after: string | undefined;
    sortKey: string | number | undefined;
}

export interface IBaseAccessPatternParams {
    index: string | undefined;
}

export abstract class BaseAccessPattern<T> implements IAccessPattern<T> {
    public readonly index: string | undefined;

    protected constructor(params: IBaseAccessPatternParams) {
        this.index = params.index;
    }

    public abstract canHandle(params: IStorageListParams): boolean;
    public abstract list(params: T): Promise<IStorageListSuccessResult>;
    public abstract createKeys(item: IAuditLog): IAccessPatternCreateKeysResult;

    protected createOptions(params: ICreateOptionsParams): EntityQueryOptions {
        return {
            limit: 25,
            startKey: createStartKey({
                after: params.after
            }),
            reverse: params.order === "DESC" ? true : false,
            index: params.index
        };
    }
}
