import { ElasticsearchIndexTemplatePlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexTemplatePlugin";

export class CmsElasticsearchIndexTemplatePlugin extends ElasticsearchIndexTemplatePlugin {
    public static override readonly type: string = "cms.elasticsearch.index.template";
}
