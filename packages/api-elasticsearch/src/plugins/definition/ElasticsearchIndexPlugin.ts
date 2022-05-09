import WebinyError from "@webiny/error";
import { Plugin } from "@webiny/plugins";
import { ElasticsearchIndexRequestBody } from "~/types";

export interface ElasticsearchIndexPluginParams {
    /**
     * For which locales are we applying this plugin.
     * Options:
     *  - locale codes to target specific locale
     *  - null for all
     */
    locales?: string[];
    body: ElasticsearchIndexRequestBody;
}

export abstract class ElasticsearchIndexPlugin extends Plugin {
    public readonly body: ElasticsearchIndexRequestBody;
    private readonly locales: string[] | undefined;

    public constructor(params: ElasticsearchIndexPluginParams) {
        super();
        const { locales, body } = params;
        this.body = {
            ...body
        };
        this.locales = locales ? locales.map(locale => locale.toLowerCase()) : undefined;
    }

    public canUse(locale: string): boolean {
        if (!this.locales) {
            return true;
        } else if (this.locales.length === 0) {
            throw new WebinyError(
                "Cannot have Elasticsearch Index Template plugin with no locales defined.",
                "LOCALES_ERROR",
                {
                    body: this.body,
                    locales: this.locales
                }
            );
        }
        return this.locales.includes(locale.toLowerCase());
    }
}
