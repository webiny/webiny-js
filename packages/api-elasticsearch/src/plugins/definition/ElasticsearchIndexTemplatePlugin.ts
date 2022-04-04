import { Plugin } from "@webiny/plugins";
import { IndicesPutTemplate } from "@elastic/elasticsearch/api/requestParams";

export interface ElasticsearchIndexTemplatePluginConfig {
    template: IndicesPutTemplate;
}

export abstract class ElasticsearchIndexTemplatePlugin extends Plugin {
    private readonly _config: ElasticsearchIndexTemplatePluginConfig;

    public get template(): IndicesPutTemplate {
        return this._config.template;
    }

    public constructor(config: ElasticsearchIndexTemplatePluginConfig) {
        super();
        this._config = config;
    }
}
