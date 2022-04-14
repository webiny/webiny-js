import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { IndicesPutTemplate } from "@elastic/elasticsearch/api/requestParams";
import { ElasticsearchIndexRequestBody } from "~/types";

interface RequestBody extends ElasticsearchIndexRequestBody {
    /**
     * Must be defined and must contain at least one index pattern.
     */
    index_patterns: string[];
    version?: number;
}

export interface ElasticsearchIndexTemplatePluginConfig extends IndicesPutTemplate<RequestBody> {
    order: number;
}

export interface ElasticsearchIndexTemplatePluginParams {
    /**
     * For which locales are we applying this plugin.
     * Options:
     *  - locale codes to target specific locale
     *  - null for all
     */
    locales?: string[];
    pattern: RegExp;
    template: ElasticsearchIndexTemplatePluginConfig;
    start: number;
}

export abstract class ElasticsearchIndexTemplatePlugin extends Plugin {
    public readonly template: ElasticsearchIndexTemplatePluginConfig;
    private readonly pattern: RegExp;
    private readonly start: number;
    private readonly locales: string[] | undefined;

    public constructor(params: ElasticsearchIndexTemplatePluginParams) {
        super();
        const { locales, pattern, template, start } = params;
        this.pattern = pattern;
        this.template = {
            ...template
        };
        this.locales = locales ? locales.map(locale => locale.toLowerCase()) : undefined;
        this.start = start;
        this.validateTemplate();
    }

    public canUse(locale: string): boolean {
        if (!this.locales) {
            return true;
        } else if (this.locales.length === 0) {
            throw new WebinyError(
                "Cannot have Elasticsearch Index Template plugin with no locales defined.",
                "LOCALES_ERROR",
                {
                    pattern: this.pattern,
                    template: this.template
                }
            );
        }
        return this.locales.includes(locale.toLowerCase());
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
