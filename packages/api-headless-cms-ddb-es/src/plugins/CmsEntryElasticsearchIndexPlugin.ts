import { OpenSearchIndexPlugin } from "@webiny/api-opensearch";

export class CmsEntryElasticsearchIndexPlugin extends OpenSearchIndexPlugin {
    public static override readonly type: string = "cms.entry.elasticsearch.index";
}
