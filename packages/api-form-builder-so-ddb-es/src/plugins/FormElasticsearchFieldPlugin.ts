import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch";

export class FormElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static override readonly type: string = "formBuilder.elasticsearch.fieldDefinition.form";
}
