import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";

export class SubmissionElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static override readonly type: string =
        "formBuilder.elasticsearch.fieldDefinition.submission";
}
