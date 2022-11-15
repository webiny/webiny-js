import { ElasticsearchSortModifierPlugin } from "@webiny/api-elasticsearch";

export class FileElasticsearchSortModifierPlugin extends ElasticsearchSortModifierPlugin {
    public static override readonly type: string = "fileManager.elasticsearch.modifier.sort.file";
}
