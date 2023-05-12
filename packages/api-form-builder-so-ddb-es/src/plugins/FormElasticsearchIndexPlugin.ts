import { ElasticsearchIndexPlugin } from "@webiny/api-elasticsearch";

export class FormElasticsearchIndexPlugin extends ElasticsearchIndexPlugin {
    public static override readonly type: string = "formBuilder.form.elasticsearch.index";
}
