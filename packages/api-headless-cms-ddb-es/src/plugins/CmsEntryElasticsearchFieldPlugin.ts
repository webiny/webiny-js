import {
    ElasticsearchFieldPlugin,
    ElasticsearchFieldPluginParams as ElasticsearchFieldPluginParamsBaseParams
} from "@webiny/api-elasticsearch";

export interface CmsEntryElasticsearchFieldPluginParams
    extends ElasticsearchFieldPluginParamsBaseParams {
    /**
     * If modelId is not passed, there is no filtering of plugins by it when plugin is applied during the runtime.
     */
    modelId?: string;
}
export class CmsEntryElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static override readonly type: string = "elasticsearch.fieldDefinition.cms.entry";

    public readonly modelId?: string;

    public constructor(params: CmsEntryElasticsearchFieldPluginParams) {
        super(params);

        this.modelId = params.modelId;
    }
}
