import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch";

export class PageElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static override readonly type: string = "pageBuilder.elasticsearch.fieldDefinition.page";
}
