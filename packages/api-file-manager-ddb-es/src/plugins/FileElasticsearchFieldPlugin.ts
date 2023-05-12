import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch";

export class FileElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static override readonly type: string = "elasticsearch.fieldDefinition.fm.file";
}
