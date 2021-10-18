import { ElasticsearchBodyModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchBodyModifierPlugin";

export class FileElasticsearchBodyModifierPlugin extends ElasticsearchBodyModifierPlugin {
    public static readonly type: string = "fileManager.elasticsearch.modifier.body.file";
}
