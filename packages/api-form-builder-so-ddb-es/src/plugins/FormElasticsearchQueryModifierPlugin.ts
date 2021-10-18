import { ElasticsearchQueryModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchQueryModifierPlugin";

export class FormElasticsearchQueryModifierPlugin extends ElasticsearchQueryModifierPlugin {
    public static readonly type: string = "formBuilder.elasticsearch.modifier.query.form";
}
