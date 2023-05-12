import { ElasticsearchIndexPlugin } from "@webiny/api-elasticsearch";

export class FileElasticsearchIndexPlugin extends ElasticsearchIndexPlugin {
    public static override readonly type: string = "fileManager.file.elasticsearch.index";
}
