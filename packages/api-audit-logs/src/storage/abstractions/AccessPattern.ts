import type { IAuditLog } from "~/storage/types.js";
import type { IStorageListParams, IStorageListSuccessResult } from "./Storage.js";

export interface IAccessPatternCreateKeysResult {
    partitionKey: string;
    sortKey: string | number;
}

export interface IAccessPattern<T> {
    index: string | undefined;
    canHandle(params: IStorageListParams): boolean;
    list(params: T): Promise<IStorageListSuccessResult>;
    createKeys(item: IAuditLog): IAccessPatternCreateKeysResult;
}
