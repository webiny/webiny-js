import { ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";

export class FormElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static override readonly type: string = "formBuilder.elasticsearch.fieldDefinition.form";
}
