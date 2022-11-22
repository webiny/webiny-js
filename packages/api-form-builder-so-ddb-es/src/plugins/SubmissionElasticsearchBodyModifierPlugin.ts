import { ElasticsearchBodyModifierPlugin } from "@webiny/api-elasticsearch";

export class SubmissionElasticsearchBodyModifierPlugin extends ElasticsearchBodyModifierPlugin {
    public static override readonly type: string =
        "formBuilder.elasticsearch.modifier.body.submission";
}
