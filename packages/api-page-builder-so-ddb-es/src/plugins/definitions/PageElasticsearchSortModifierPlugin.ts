import { ElasticsearchSortModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchSortModifierPlugin";

export class PageElasticsearchSortModifierPlugin extends ElasticsearchSortModifierPlugin {
    public static readonly type: string = "pageBuilder.elasticsearch.modifier.sort.page";
}
