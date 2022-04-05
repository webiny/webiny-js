import { CmsElasticsearchIndexTemplatePlugin } from "~/plugins/CmsElasticsearchIndexTemplatePlugin";

export const createDefaultElasticsearchIndexTemplate = (): CmsElasticsearchIndexTemplatePlugin => {
    return new CmsElasticsearchIndexTemplatePlugin({
        template: {
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
        }
    });
};
