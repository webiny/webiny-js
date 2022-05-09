import { ElasticsearchIndexPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexPlugin";

export class FileElasticsearchIndexPlugin extends ElasticsearchIndexPlugin {
    public static override readonly type: string = "fileManager.file.elasticsearch.index";
}
