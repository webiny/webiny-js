import { ElasticsearchSortModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchSortModifierPlugin";

export class FileElasticsearchSortModifierPlugin extends ElasticsearchSortModifierPlugin {
    public static readonly type: string = "fileManager.elasticsearch.modifier.sort.file";
}
