import { ElasticsearchQueryModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryModifierPlugin";

export class FileElasticsearchQueryModifierPlugin extends ElasticsearchQueryModifierPlugin {
    public static override readonly type: string = "fileManager.elasticsearch.modifier.query.file";
}
