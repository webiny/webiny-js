import { ElasticsearchSortModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchSortModifierPlugin";
import { FileManagerContext } from "@webiny/api-file-manager/types";

export class FileElasticsearchSortModifierPlugin extends ElasticsearchSortModifierPlugin<FileManagerContext> {
    public static readonly type: string = "fileManager.elasticsearch.modifier.sort.file";
}
