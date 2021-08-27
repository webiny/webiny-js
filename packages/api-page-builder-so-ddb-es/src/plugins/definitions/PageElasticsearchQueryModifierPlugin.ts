import { ElasticsearchQueryModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryModifierPlugin";

export class PageElasticsearchQueryModifierPlugin extends ElasticsearchQueryModifierPlugin {
    public static readonly type: string = "pageBuilder.elasticsearch.modifier.sort.page";
}
