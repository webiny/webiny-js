import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";

export class CmsEntryElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static readonly type: string = "elasticsearch.fieldDefinition.cms.entry";
    
}
