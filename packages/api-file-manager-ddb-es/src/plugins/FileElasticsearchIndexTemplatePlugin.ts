import {
    ElasticsearchIndexTemplatePlugin,
    ElasticsearchIndexTemplatePluginConfig
} from "@webiny/api-elasticsearch/plugins/definition/ElasticsearchIndexTemplatePlugin";

export class FileElasticsearchIndexTemplatePlugin extends ElasticsearchIndexTemplatePlugin {
    public static override readonly type: string = "fileManager.file.elasticsearch.index.template";

    public constructor(template: ElasticsearchIndexTemplatePluginConfig, locales?: string[]) {
        super({
            locales,
            pattern: new RegExp(/-file-manager$/),
            template,
            start: 0
        });
    }
}
