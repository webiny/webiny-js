import type { GenericRecord } from "@webiny/api/types.js";
import type { IStorageItem } from "../types.js";
import type { IAccessPattern } from "./AccessPattern.js";
import type { IStorageListParams } from "./Storage.js";

export interface IAccessPatternHandlerHandleResult {
    items: IStorageItem[];
    lastEvaluatedKey?: GenericRecord;
}

export interface IAccessPatternHandler {
    handle(params: IStorageListParams): Promise<IAccessPatternHandlerHandleResult>;
    getDefaultPattern(): IAccessPattern<unknown>;
    listIndexPatterns(): IAccessPattern<unknown>[];
}
