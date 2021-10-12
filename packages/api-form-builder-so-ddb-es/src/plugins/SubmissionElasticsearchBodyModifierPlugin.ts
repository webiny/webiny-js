import { ElasticsearchBodyModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchBodyModifierPlugin";

export class SubmissionElasticsearchBodyModifierPlugin extends ElasticsearchBodyModifierPlugin {
    public static readonly type: string = "formBuilder.elasticsearch.modifier.body.submission";
}
