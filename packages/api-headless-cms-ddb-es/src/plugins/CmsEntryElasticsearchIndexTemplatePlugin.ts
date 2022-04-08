import {
    ElasticsearchIndexTemplatePlugin,
    ElasticsearchIndexTemplatePluginConfig
} from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexTemplatePlugin";

export class CmsEntryElasticsearchIndexTemplatePlugin extends ElasticsearchIndexTemplatePlugin {
    public static override readonly type: string = "cms.entry.elasticsearch.index.template";

    public constructor(template: ElasticsearchIndexTemplatePluginConfig) {
        super("-headless-cms-", template);
    }
}
