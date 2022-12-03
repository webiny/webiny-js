import { ElasticsearchQueryModifierPlugin } from "@webiny/api-elasticsearch";

export class SubmissionElasticsearchQueryModifierPlugin extends ElasticsearchQueryModifierPlugin {
    public static override readonly type: string =
        "formBuilder.elasticsearch.modifier.query.submission";
}
