import type { IAuditLog } from "@webiny/api-audit-logs/storage/types.js";
import type { IStorageItem } from "~/types.js";
import type { IStorageListParams } from "@webiny/api-audit-logs/storage/abstractions/Storage.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IAccessPatternCreateKeysResult {
    partitionKey: string;
    sortKey: string | number;
}

export interface IAccessPatternListResult {
    items: IStorageItem[];
    lastEvaluatedKey?: GenericRecord;
}

export type IAccessPatternHandlesKeys = keyof IStorageListParams;

export interface IAccessPatternHandles {
    shouldInclude?: IAccessPatternHandlesKeys[];
    mustInclude: IAccessPatternHandlesKeys[];
    mustNotInclude: IAccessPatternHandlesKeys[];
}

export interface IAccessPattern<T> {
    index: string | undefined;
    handles(): IAccessPatternHandles;
    canHandle(params: IStorageListParams): boolean;
    list(params: T): Promise<IAccessPatternListResult>;
    createKeys(item: IAuditLog): IAccessPatternCreateKeysResult;
}
