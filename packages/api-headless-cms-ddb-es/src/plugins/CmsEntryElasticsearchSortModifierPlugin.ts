import { ElasticsearchSortModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchSortModifierPlugin";

export class CmsEntryElasticsearchSortModifierPlugin extends ElasticsearchSortModifierPlugin {
    public static readonly type: string = "cms.elasticsearch.modifier.sort.entry";
}
