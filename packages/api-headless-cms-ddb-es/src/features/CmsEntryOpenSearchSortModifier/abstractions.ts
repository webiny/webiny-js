import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { Sort } from "@webiny/api-opensearch/types.js";

export interface ModifySortParams {
    sort: Sort;
    model: CmsModel;
}

export interface ICmsEntryOpenSearchSortModifier {
    readonly modelId?: string;
    modifySort(params: ModifySortParams): void;
}

export const CmsEntryOpenSearchSortModifier = createAbstraction<ICmsEntryOpenSearchSortModifier>(
    "Cms/Entry/OpenSearch/SortModifier"
);

export namespace CmsEntryOpenSearchSortModifier {
    export type Interface = ICmsEntryOpenSearchSortModifier;
    export type Params = ModifySortParams;
}
