import { ElasticsearchIndexPlugin } from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexPlugin";

export class FormElasticsearchIndexPlugin extends ElasticsearchIndexPlugin {
    public static override readonly type: string = "formBuilder.form.elasticsearch.index";
}
