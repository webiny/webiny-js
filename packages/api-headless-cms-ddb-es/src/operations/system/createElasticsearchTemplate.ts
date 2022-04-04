import WebinyError from "@webiny/error";
import { Client } from "@elastic/elasticsearch";
import { IndicesPutTemplate } from "@elastic/elasticsearch/api/requestParams";
import { PluginsContainer } from "@webiny/plugins";
import { CmsElasticsearchIndexTemplatePlugin } from "~/plugins/CmsElasticsearchIndexTemplatePlugin";

export interface CreateElasticsearchTemplateParams {
    elasticsearch: Client;
    plugins: PluginsContainer;
}

export const createElasticsearchTemplate = async (params: CreateElasticsearchTemplateParams) => {
    const { elasticsearch, plugins } = params;

    const templatePlugins = plugins.byType<CmsElasticsearchIndexTemplatePlugin>(
        CmsElasticsearchIndexTemplatePlugin.type
    );

    const names: string[] = [];
    for (const plugin of templatePlugins) {
        const name = plugin.template.name;
        if (names.includes(name)) {
            throw new WebinyError(
                "Duplicate CmsElasticsearchIndexTemplatePlugin template name.",
                "DUPLICATE_TEMPLATE_NAME",
                {
                    name
                }
            );
        }
        names.push(name);
    }

    const options: IndicesPutTemplate = {
        name: "headless-cms-entries-index",
        body: {
            index_patterns: ["*headless-cms*"],
            settings: {
                analysis: {
                    analyzer: {
                        lowercase_analyzer: {
                            type: "custom",
                            filter: ["lowercase", "trim"],
                            tokenizer: "keyword"
                        }
                    }
                }
            },
            mappings: {
                properties: {
                    property: {
                        type: "text",
                        fields: {
                            keyword: {
                                type: "keyword",
                                ignore_above: 256
                            }
                        },
                        analyzer: "lowercase_analyzer"
                    },
                    rawValues: {
                        type: "object",
                        enabled: false
                    }
                }
            }
        }
    };

    try {
        await elasticsearch.indices.putTemplate(options);
    } catch (ex) {
        throw new WebinyError(
            ex.message || "Could not create Elasticsearch index template for the Headless CMS.",
            ex.code || "CMS_ELASTICSEARCH_TEMPLATE_ERROR",
            {
                error: ex,
                options
            }
        );
    }
};
