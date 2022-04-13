import {
    ElasticsearchIndexTemplatePlugin,
    ElasticsearchIndexTemplatePluginConfig
} from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexTemplatePlugin";

export class CmsEntryElasticsearchIndexTemplatePlugin extends ElasticsearchIndexTemplatePlugin {
    public static override readonly type: string = "cms.entry.elasticsearch.index.template";

    public constructor(template: ElasticsearchIndexTemplatePluginConfig, locales?: string[]) {
        super({
            locales,
            pattern: new RegExp(/-headless-cms-/),
            template,
            start: 200
        });
    }
}
