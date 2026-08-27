import { createAbstraction } from "@webiny/feature/api";
import type { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types.js";
import type { ModelFields } from "~/operations/entry/elasticsearch/types.js";

export interface ICmsEntryOpenSearchExecFilteringParams {
    model: CmsModel;
    fields: ModelFields;
    where: CmsEntryListWhere;
    query: OpenSearchBoolQueryConfig;
}

export interface ICmsEntryOpenSearchExecFiltering {
    execute(params: ICmsEntryOpenSearchExecFilteringParams): void;
}

export const CmsEntryOpenSearchExecFiltering = createAbstraction<ICmsEntryOpenSearchExecFiltering>(
    "Cms/Entry/OpenSearch/ExecFiltering"
);

export namespace CmsEntryOpenSearchExecFiltering {
    export type Interface = ICmsEntryOpenSearchExecFiltering;
    export type Params = ICmsEntryOpenSearchExecFilteringParams;
}
