import { ElasticsearchQueryModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryModifierPlugin";
import { FileManagerContext } from "@webiny/api-file-manager/types";

export class FileElasticsearchQueryModifierPlugin extends ElasticsearchQueryModifierPlugin<FileManagerContext> {
    public static readonly type: string = "fileManager.elasticsearch.modifier.query.file";
}
