import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { IndicesPutTemplate } from "@elastic/elasticsearch/api/requestParams";

interface RequestBodyParams {
    /**
     * Must be defined and must contain at least one index pattern.
     */
    index_patterns: string[];
    settings: {
        index: {
            [key: string]: any;
        };
    };
    mappings: {
        properties?: {
            [key: string]: any;
        };
        [key: string]: any;
    };
    aliases: {
        [key: string]: {
            filter?: {
                [key: string]: any;
            };
            index_routing?: string;
            is_hidden?: boolean;
            is_write_index?: boolean;
            routing?: string;
            search_routing?: string;
        };
    };
    version?: number;
}

export type ElasticsearchIndexTemplatePluginConfig = IndicesPutTemplate<RequestBodyParams> & {
    order: number;
};

export interface ElasticsearchIndexTemplatePluginParams {
    pattern: RegExp;
    template: ElasticsearchIndexTemplatePluginConfig;
    start: number;
}

export abstract class ElasticsearchIndexTemplatePlugin extends Plugin {
    public readonly template: ElasticsearchIndexTemplatePluginConfig;
    private readonly pattern: RegExp;
    private readonly start: number;

    public constructor(params: ElasticsearchIndexTemplatePluginParams) {
        super();
        const { pattern, template, start } = params;
        this.pattern = pattern;
        this.template = {
            ...template
        };
        this.start = start;
        this.validateTemplate();
    }

    private validateTemplate(): void {
        const min = this.start;
        /**
         * We allow only start + 99 order values.
         */
        const max = min + 99;
        if (this.template.order < min) {
            throw new WebinyError(
                "Invalid index template order value.",
                "INVALID_ES_TEMPLATE_DEFINITION",
                {
                    config: this.template,
                    value: this.template.order,
                    min
                }
            );
        } else if (this.template.order > max) {
            throw new WebinyError(
                "Invalid index template order value.",
                "INVALID_ES_TEMPLATE_DEFINITION",
                {
                    config: this.template,
                    value: this.template.order,
                    max
                }
            );
        }
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
            if (pattern.match(this.pattern) !== null) {
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
