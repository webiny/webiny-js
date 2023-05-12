import { ElasticsearchSortModifierPlugin } from "@webiny/api-elasticsearch";

export class SubmissionElasticsearchSortModifierPlugin extends ElasticsearchSortModifierPlugin {
    public static override readonly type: string =
        "formBuilder.elasticsearch.modifier.sort.submission";
}
