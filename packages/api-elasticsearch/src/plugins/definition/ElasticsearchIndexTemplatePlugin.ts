import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { IndicesPutTemplate } from "@elastic/elasticsearch/api/requestParams";

interface RequestBodyParams {
    /**
     * Must be defined and must contain at least one index pattern.
     */
    index_patterns: string[];
    [key: string]: any;
}

interface ElasticsearchIndexTemplatePluginConfigTemplate extends IndicesPutTemplate {
    order: number;
    body: RequestBodyParams;
}
export interface ElasticsearchIndexTemplatePluginConfig {
    template: ElasticsearchIndexTemplatePluginConfigTemplate;
}

export abstract class ElasticsearchIndexTemplatePlugin extends Plugin {
    private readonly _config: ElasticsearchIndexTemplatePluginConfig;

    public get template(): IndicesPutTemplate {
        return this._config.template;
    }

    public constructor(config: ElasticsearchIndexTemplatePluginConfig) {
        super();
        this._config = config;
        this.validateTemplate(config.template);
    }

    private validateTemplate(template: ElasticsearchIndexTemplatePluginConfigTemplate): void {
        /**
         * Name cannot contain anything other than a-z, 0-9 and -.
         */
        const name = template.name;
        if (name.match(/^([a-z0-9\-]+)$/) === null) {
            throw new WebinyError(
                `Index template name not supported.`,
                "INVALID_ES_TEMPLATE_DEFINITION",
                {
                    template
                }
            );
        }
        /**
         * Must have at least one pattern.
         */
        const patterns = (template.body.index_patterns || []).filter(Boolean);
        if (patterns.length === 0) {
            throw new WebinyError(
                `Missing "index_patterns" in template "${name}" body.`,
                "INVALID_ES_TEMPLATE_DEFINITION",
                {
                    template
                }
            );
        }
        /**
         * Order must be greater than 0.
         */
        if (template.order <= 0) {
            throw new WebinyError(
                `Order must be greater than 0 in template "${name}".`,
                "INVALID_ES_TEMPLATE_DEFINITION",
                {
                    template
                }
            );
        }
    }
}
