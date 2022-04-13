import {
    ElasticsearchIndexTemplatePlugin,
    ElasticsearchIndexTemplatePluginConfig
} from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexTemplatePlugin";

export class FormElasticsearchIndexTemplatePlugin extends ElasticsearchIndexTemplatePlugin {
    public static override readonly type: string = "formBuilder.form.elasticsearch.index.template";

    public constructor(template: ElasticsearchIndexTemplatePluginConfig, locales?: string[]) {
        super({
            locales,
            pattern: new RegExp(/-form-builder$/),
            template,
            start: 100
        });
    }
}
