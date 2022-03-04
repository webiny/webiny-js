import { ElasticsearchQueryModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryModifierPlugin";

export class PageElasticsearchQueryModifierPlugin extends ElasticsearchQueryModifierPlugin {
    public static override readonly type: string = "pageBuilder.elasticsearch.modifier.query.page";
}
