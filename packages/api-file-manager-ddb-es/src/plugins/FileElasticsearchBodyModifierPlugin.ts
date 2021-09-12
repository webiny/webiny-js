import { ElasticsearchBodyModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchBodyModifierPlugin";
import { FileManagerContext } from "@webiny/api-file-manager/types";

export class FileElasticsearchBodyModifierPlugin extends ElasticsearchBodyModifierPlugin<FileManagerContext> {
    public static readonly type: string = "fileManager.elasticsearch.modifier.body.file";
}
