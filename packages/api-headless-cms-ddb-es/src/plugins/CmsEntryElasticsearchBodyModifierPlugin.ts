import { ElasticsearchBodyModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchBodyModifierPlugin";

export class CmsEntryElasticsearchBodyModifierPlugin extends ElasticsearchBodyModifierPlugin {
    public static readonly type: string = "cms.elasticsearch.modifier.body.entry";
}
