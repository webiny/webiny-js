import { ElasticsearchIndexTemplatePlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexTemplatePlugin";

export class FormElasticsearchIndexTemplatePlugin extends ElasticsearchIndexTemplatePlugin {
    public static override readonly type: string = "formBuilder.form.elasticsearch.index.template";
}
