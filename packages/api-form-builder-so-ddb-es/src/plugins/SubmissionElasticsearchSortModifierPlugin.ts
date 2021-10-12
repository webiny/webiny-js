import { ElasticsearchSortModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchSortModifierPlugin";

export class SubmissionElasticsearchSortModifierPlugin extends ElasticsearchSortModifierPlugin {
    public static readonly type: string = "formBuilder.elasticsearch.modifier.sort.submission";
}
