import { ElasticsearchQueryModifierPlugin } from "@webiny/api-elasticsearch";

export class FileElasticsearchQueryModifierPlugin extends ElasticsearchQueryModifierPlugin {
    public static override readonly type: string = "fileManager.elasticsearch.modifier.query.file";
}
