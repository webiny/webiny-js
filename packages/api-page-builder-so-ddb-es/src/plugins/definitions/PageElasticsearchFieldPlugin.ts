import {
    ElasticsearchFieldPlugin,
    Params
} from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchFieldPlugin";

export class PageElasticsearchFieldPlugin extends ElasticsearchFieldPlugin {
    public static readonly type: string = "pageBuilder.elasticsearch.fieldDefinition.page";

    public constructor(params: Omit<Params, "entity">) {
        super({
            ...params
        });
    }
}
