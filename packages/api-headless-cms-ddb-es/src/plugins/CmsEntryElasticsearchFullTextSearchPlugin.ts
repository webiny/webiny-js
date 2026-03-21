import { Plugin } from "@webiny/plugins";
import type { OpenSearchBoolQueryConfig as ElasticsearchBoolQueryConfig } from "@webiny/api-opensearch/types.js";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ModelField, ModelFields } from "~/operations/entry/elasticsearch/types.js";

export interface CmsEntryElasticsearchFullTextSearchPluginCbParams {
    model: CmsModel;
    query: ElasticsearchBoolQueryConfig;
    term: string;
    fields: ModelFields;
    createFieldPath: (field: ModelField) => string;
    prepareTerm: (term: string) => string;
}
export interface CmsEntryElasticsearchFullTextSearchPluginParams {
    models?: string[];
    apply: (params: CmsEntryElasticsearchFullTextSearchPluginCbParams) => void;
}
export class CmsEntryElasticsearchFullTextSearchPlugin extends Plugin {
    public static override readonly type: string =
        "headless-cms.elasticsearch.entry.fullTextSearch";

    private readonly params: CmsEntryElasticsearchFullTextSearchPluginParams;

    public get models() {
        return this.params.models;
    }

    public constructor(params: CmsEntryElasticsearchFullTextSearchPluginParams) {
        super();
        this.params = params;
    }

    public apply(params: CmsEntryElasticsearchFullTextSearchPluginCbParams): void {
        return this.params.apply(params);
    }
}

export const createCmsEntryElasticsearchFullTextSearchPlugin = (
    params: CmsEntryElasticsearchFullTextSearchPluginParams
) => {
    return new CmsEntryElasticsearchFullTextSearchPlugin(params);
};
