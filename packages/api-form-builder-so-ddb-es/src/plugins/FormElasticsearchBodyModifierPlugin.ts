import { ElasticsearchBodyModifierPlugin } from "@webiny/api-elasticsearch";

export class FormElasticsearchBodyModifierPlugin extends ElasticsearchBodyModifierPlugin {
    public static override readonly type: string = "formBuilder.elasticsearch.modifier.body.form";
}
