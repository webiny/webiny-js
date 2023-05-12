import { ElasticsearchIndexPlugin } from "@webiny/api-elasticsearch";

export class PageElasticsearchIndexPlugin extends ElasticsearchIndexPlugin {
    public static override readonly type: string = "pageBuilder.page.elasticsearch.index";
}
