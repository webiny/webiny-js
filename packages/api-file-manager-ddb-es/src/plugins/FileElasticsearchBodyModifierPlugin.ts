import { ElasticsearchBodyModifierPlugin } from "@webiny/api-elasticsearch";

export class FileElasticsearchBodyModifierPlugin extends ElasticsearchBodyModifierPlugin {
    public static override readonly type: string = "fileManager.elasticsearch.modifier.body.file";
}
