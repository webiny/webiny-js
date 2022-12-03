import { ElasticsearchSortModifierPlugin } from "@webiny/api-elasticsearch";

export class FormElasticsearchSortModifierPlugin extends ElasticsearchSortModifierPlugin {
    public static override readonly type: string = "formBuilder.elasticsearch.modifier.sort.form";
}
