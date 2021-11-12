import { ElasticsearchQueryModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryModifierPlugin";

export class CmsEntryElasticsearchQueryModifierPlugin extends ElasticsearchQueryModifierPlugin {
    public static readonly type: string = "cms.elasticsearch.modifier.query.entry";
}
