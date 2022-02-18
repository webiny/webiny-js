import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";

export class PageElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static readonly type: string = "pageBuilder.elasticsearch.fieldDefinition.page";
}
