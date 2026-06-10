import type { GenericRecord } from "@webiny/api/types.js";
import type { IStorageItem } from "~/types.js";
import type { IAccessPattern } from "~/abstractions/AccessPattern.js";
import type { IStorageListParams } from "@webiny/api-audit-logs/storage/abstractions/Storage.js";

export interface IAccessPatternHandlerHandleResult {
    items: IStorageItem[];
    lastEvaluatedKey?: GenericRecord;
}

export interface IAccessPatternHandler {
    handle(params: IStorageListParams): Promise<IAccessPatternHandlerHandleResult>;
    getDefaultPattern(): IAccessPattern<unknown>;
    listIndexPatterns(): IAccessPattern<unknown>[];
}
