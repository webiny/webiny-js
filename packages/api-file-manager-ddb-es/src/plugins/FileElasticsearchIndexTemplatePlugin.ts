import { ElasticsearchIndexTemplatePlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexTemplatePlugin";

export class FileElasticsearchIndexTemplatePlugin extends ElasticsearchIndexTemplatePlugin {
    public static override readonly type: string = "fileManager.file.elasticsearch.index.template";
}
