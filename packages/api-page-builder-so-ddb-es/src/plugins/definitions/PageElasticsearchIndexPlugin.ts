import { ElasticsearchIndexPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexPlugin";

export class PageElasticsearchIndexPlugin extends ElasticsearchIndexPlugin {
    public static override readonly type: string = "pageBuilder.page.elasticsearch.index";
}
