import type { IAuditLog, IStorageItem } from "~/storage/types.js";
import type { IStorageListParams } from "./Storage.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IAccessPatternCreateKeysResult {
    partitionKey: string;
    sortKey: string | number;
}

export interface IAccessPatternListResult {
    items: IStorageItem[];
    lastEvaluatedKey?: GenericRecord;
}

export interface IAccessPattern<T> {
    index: string | undefined;
    canHandle(params: IStorageListParams): boolean;
    list(params: T): Promise<IAccessPatternListResult>;
    createKeys(item: IAuditLog): IAccessPatternCreateKeysResult;
}
