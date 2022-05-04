import { ElasticsearchIndexPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexPlugin";

export class CmsEntryElasticsearchIndexPlugin extends ElasticsearchIndexPlugin {
    public static override readonly type: string = "cms.entry.elasticsearch.index";
}
