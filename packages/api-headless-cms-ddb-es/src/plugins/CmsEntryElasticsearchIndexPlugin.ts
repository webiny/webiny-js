import { OpenSearchIndexPlugin as ElasticsearchIndexPlugin } from "@webiny/api-opensearch";

export class CmsEntryElasticsearchIndexPlugin extends ElasticsearchIndexPlugin {
    public static override readonly type: string = "cms.entry.elasticsearch.index";
}
