import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { IndicesPutTemplate } from "@elastic/elasticsearch/api/requestParams";

interface RequestBodyParams {
    /**
     * Must be defined and must contain at least one index pattern.
     */
    index_patterns: string[];
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
}

export type ElasticsearchIndexTemplatePluginConfig = IndicesPutTemplate<RequestBodyParams> & {
    order: number;
};

export abstract class ElasticsearchIndexTemplatePlugin extends Plugin {
    public readonly template: ElasticsearchIndexTemplatePluginConfig;

    private pattern: string;

    public constructor(pattern: string, template: ElasticsearchIndexTemplatePluginConfig) {
        super();
        this.pattern = pattern;
        this.template = {
            ...template
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
        const patterns = this.template.body.index_patterns.filter(Boolean);
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
         * All patterns must contain the target check pattern.
         */
        for (const pattern of this.template.body.index_patterns) {
            if (pattern.match(new RegExp(`${this.pattern}`)) !== null) {
                continue;
            }
            throw new WebinyError(
                `Wrong pattern in "index_patterns" in template "${name}" body.`,
                "INVALID_ES_TEMPLATE_DEFINITION",
                {
                    config: this.template,
                    pattern
                }
            );
        }
        /**
         * Order must be greater than 0.
         */
        if (this.template.order <= 0) {
            throw new WebinyError(
                `Order must be greater than 0 in template "${name}".`,
                "INVALID_ES_TEMPLATE_DEFINITION",
                {
                    config: this.template
                }
            );
        }
    }
}
