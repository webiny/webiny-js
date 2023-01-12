import { ElasticsearchSortModifierPlugin } from "@webiny/api-elasticsearch";

export class PageElasticsearchSortModifierPlugin extends ElasticsearchSortModifierPlugin {
    public static override readonly type: string = "pageBuilder.elasticsearch.modifier.sort.page";
}
