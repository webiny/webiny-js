import { ElasticsearchQueryModifierPlugin } from "@webiny/api-elasticsearch";

export class PageElasticsearchQueryModifierPlugin extends ElasticsearchQueryModifierPlugin {
    public static override readonly type: string = "pageBuilder.elasticsearch.modifier.query.page";
}
