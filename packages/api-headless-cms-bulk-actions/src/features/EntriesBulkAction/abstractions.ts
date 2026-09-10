import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntry, CmsEntryMeta, CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IBulkActionListParams {
    where?: Record<string, any>;
    search?: string;
    after?: string | null;
    limit?: number;
}

export interface IBulkActionListResult {
    entries: CmsEntry[];
    meta: CmsEntryMeta;
}

export interface IBulkActionProcessParams<TData = Record<string, any>> {
    id: string;
    // The `data` payload the Admin action sent along with the trigger. Type it by
    // parameterizing `EntriesBulkAction.Interface<TData>` on your implementation.
    data?: TData;
}

export interface IEntriesBulkAction<TData = Record<string, any>> {
    readonly name: string;
    readonly modelIds?: string[]; // Optional: filter which models get GraphQL mutations
    readonly batchSize?: number;
    loadData(model: CmsModel, params: IBulkActionListParams): Promise<IBulkActionListResult>;
    processData(model: CmsModel, params: IBulkActionProcessParams<TData>): Promise<void>;
}

export const EntriesBulkAction = createAbstraction<IEntriesBulkAction>("EntriesBulkAction");

export namespace EntriesBulkAction {
    export type Interface<TData = Record<string, any>> = IEntriesBulkAction<TData>;
    export type Model = CmsModel;
    export type LoadDataParams = IBulkActionListParams;
    export type LoadDataResult = IBulkActionListResult;
    export type ProcessParams<TData = Record<string, any>> = IBulkActionProcessParams<TData>;
}

interface IEntriesBulkActionConfig {
    batchSize: number;
}

export const EntriesBulkActionConfig =
    createAbstraction<IEntriesBulkActionConfig>("EntriesBulkActionConfig");

export namespace EntriesBulkActionConfig {
    export type Interface = IEntriesBulkActionConfig;
}
