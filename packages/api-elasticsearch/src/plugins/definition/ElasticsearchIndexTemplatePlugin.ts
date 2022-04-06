import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { IndicesPutIndexTemplate } from "@elastic/elasticsearch/api/requestParams";

interface RequestBodyParams {
    /**
     * Must be defined and must contain at least one index pattern.
     */
    index_patterns: string[];
    priority: number;
    template: {
        settings?: {
            [key: string]: any;
        };
        mappings?: {
            properties?: {
                [key: string]: any;
            };
            [key: string]: any;
        };
        [key: string]: any;
    };
}

export type ElasticsearchIndexTemplatePluginConfig = IndicesPutIndexTemplate<RequestBodyParams>;

export abstract class ElasticsearchIndexTemplatePlugin extends Plugin {
    public readonly template: ElasticsearchIndexTemplatePluginConfig;

    public constructor(config: ElasticsearchIndexTemplatePluginConfig) {
        super();
        this.template = {
            ...config,
            method: config.method || "POST"
        };
        this.validateTemplate();
    }

    private validateTemplate(): void {
        /**
         * Name cannot contain anything other than a-z, 0-9 and -.
         */
        const name = this.template.name;
        if (name.match(/^([a-z0-9\-]+)$/) === null) {
            throw new WebinyError(
                `Index template name not supported.`,
                "INVALID_ES_TEMPLATE_DEFINITION",
                {
                    config: this.template
                }
            );
        }
        /**
         * Must have at least one pattern.
         */
        const patterns = (this.template.body.index_patterns || []).filter(Boolean);
        if (patterns.length === 0) {
            throw new WebinyError(
                `Missing "index_patterns" in template "${name}" body.`,
                "INVALID_ES_TEMPLATE_DEFINITION",
                {
                    config: this.template
                }
            );
        }
        /**
         * Order must be greater than 0.
         */
        if (this.template.body.priority <= 0) {
            throw new WebinyError(
                `Priority must be greater than 0 in template "${name}".`,
                "INVALID_ES_TEMPLATE_DEFINITION",
                {
                    config: this.template
                }
            );
        }
    }
}
