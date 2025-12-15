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

export interface IBulkActionProcessParams {
    id: string;
    data?: Record<string, any>;
}

export interface IEntriesBulkAction {
    readonly name: string;
    readonly modelIds?: string[]; // Optional: filter which models get GraphQL mutations
    readonly batchSize?: number;
    loadData(model: CmsModel, params: IBulkActionListParams): Promise<IBulkActionListResult>;
    processData(model: CmsModel, params: IBulkActionProcessParams): Promise<void>;
}

export const EntriesBulkAction = createAbstraction<IEntriesBulkAction>("EntriesBulkAction");

export namespace EntriesBulkAction {
    export type Interface = IEntriesBulkAction;
    export type Model = CmsModel;
    export type LoadDataParams = IBulkActionListParams;
    export type LoadDataResult = IBulkActionListResult;
    export type ProcessParams = IBulkActionProcessParams;
}
