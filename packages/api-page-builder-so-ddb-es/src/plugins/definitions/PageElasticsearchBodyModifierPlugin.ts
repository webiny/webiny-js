import { ElasticsearchBodyModifierPlugin } from "@webiny/api-elasticsearch";

export class PageElasticsearchBodyModifierPlugin extends ElasticsearchBodyModifierPlugin {
    public static override readonly type: string = "pageBuilder.elasticsearch.modifier.body.page";
}
