import { ElasticsearchIndexTemplatePlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexTemplatePlugin";

export class PageElasticsearchIndexTemplatePlugin extends ElasticsearchIndexTemplatePlugin {
    public static override readonly type: string = "pageBuilder.page.elasticsearch.index.template";
}
