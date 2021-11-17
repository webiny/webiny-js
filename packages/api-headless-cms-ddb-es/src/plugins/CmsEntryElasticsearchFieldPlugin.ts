import {
    ElasticsearchFieldPlugin,
    Params as BaseParams
} from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";

export interface Params extends BaseParams {
    /**
     * If modelId is not passed, there is no filtering of plugins by it when plugin is applied during the runtime.
     */
    modelId?: string;
}
export class CmsEntryElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static readonly type: string = "elasticsearch.fieldDefinition.cms.entry";

    public readonly modelId?: string;

    public constructor(params: Params) {
        super(params);

        this.modelId = params.modelId;
    }
}
