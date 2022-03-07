import { ElasticsearchSortModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchSortModifierPlugin";

export class SubmissionElasticsearchSortModifierPlugin extends ElasticsearchSortModifierPlugin {
    public static override readonly type: string =
        "formBuilder.elasticsearch.modifier.sort.submission";
}
