import { ElasticsearchBodyModifierPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchBodyModifierPlugin";

export class FormElasticsearchBodyModifierPlugin extends ElasticsearchBodyModifierPlugin {
    public static readonly type: string = "formBuilder.elasticsearch.modifier.body.form";
}
