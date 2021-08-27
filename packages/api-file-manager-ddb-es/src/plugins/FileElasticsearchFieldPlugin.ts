import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";

export class FileElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static readonly type: string = "elasticsearch.fieldDefinition.file";
}
