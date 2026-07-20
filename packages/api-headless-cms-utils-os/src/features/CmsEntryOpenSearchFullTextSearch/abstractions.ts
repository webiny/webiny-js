import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { OpenSearchBoolQueryConfig } from "@webiny/api-opensearch/types.js";
import type { ModelField, ModelFields } from "~/operations/entry/elasticsearch/types.js";

export interface ApplyFullTextSearchParams {
    model: CmsModel;
    query: OpenSearchBoolQueryConfig;
    term: string;
    fields: ModelFields;
    createFieldPath: (field: ModelField) => string;
    prepareTerm: (term: string) => string;
}

export interface ICmsEntryOpenSearchFullTextSearch {
    readonly models?: string[];
    apply(params: ApplyFullTextSearchParams): void;
}

export const CmsEntryOpenSearchFullTextSearch =
    createAbstraction<ICmsEntryOpenSearchFullTextSearch>("Cms/Entry/OpenSearch/FullTextSearch");

export namespace CmsEntryOpenSearchFullTextSearch {
    export type Interface = ICmsEntryOpenSearchFullTextSearch;
    export type Params = ApplyFullTextSearchParams;
}
