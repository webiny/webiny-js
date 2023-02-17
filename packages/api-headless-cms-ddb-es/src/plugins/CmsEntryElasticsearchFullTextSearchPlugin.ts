import { Plugin } from "@webiny/plugins";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";

export interface CmsEntryElasticsearchFullTextSearchPluginCbParams {
    model: CmsModel;
    query: ElasticsearchBoolQueryConfig;
    term: string;
    fields: CmsModelField[];
    createFieldPath: (field: CmsModelField) => string;
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
