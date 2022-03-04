import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";

export class FileElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static override readonly type: string = "elasticsearch.fieldDefinition.fm.file";
}
