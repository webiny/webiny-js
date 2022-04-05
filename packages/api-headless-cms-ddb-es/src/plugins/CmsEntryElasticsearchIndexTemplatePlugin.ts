import { ElasticsearchIndexTemplatePlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexTemplatePlugin";

export class CmsEntryElasticsearchIndexTemplatePlugin extends ElasticsearchIndexTemplatePlugin {
    public static override readonly type: string = "cms.entry.elasticsearch.index.template";
}
