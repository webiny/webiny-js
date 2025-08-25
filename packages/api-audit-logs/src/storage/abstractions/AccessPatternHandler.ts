import type { IAccessPattern } from "./AccessPattern.js";
import type { IStorageListParams, IStorageListResult } from "./Storage.js";

export interface IAccessPatternHandler {
    addPatterns(patterns: IAccessPattern<unknown>[]): void;
    handle(params: IStorageListParams): Promise<IStorageListResult>;
    getDefaultPattern(): IAccessPattern<unknown>;
    listIndexPatterns(): IAccessPattern<unknown>[];
}
