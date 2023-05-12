import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch";

export class SubmissionElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static override readonly type: string =
        "formBuilder.elasticsearch.fieldDefinition.submission";
}
