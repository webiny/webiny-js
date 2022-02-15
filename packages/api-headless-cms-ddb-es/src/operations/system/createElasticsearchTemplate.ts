import WebinyError from "@webiny/error";
import { Client } from "@elastic/elasticsearch";
import { IndicesPutTemplate } from "@elastic/elasticsearch/api/requestParams";

export interface CreateElasticsearchTemplateParams {
    elasticsearch: Client;
}

export const createElasticsearchTemplate = async (params: CreateElasticsearchTemplateParams) => {
    const { elasticsearch } = params;

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
