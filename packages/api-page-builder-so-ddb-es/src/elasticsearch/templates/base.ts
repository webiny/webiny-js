import { PageElasticsearchIndexTemplatePlugin } from "~/plugins/definitions/PageElasticsearchIndexTemplatePlugin";

export const base = new PageElasticsearchIndexTemplatePlugin({
    name: "page-builder-pages-index-default",
    order: 350,
    body: {
        index_patterns: ["*-page-builder"],
        aliases: {},
        settings: {
            index: {
                analysis: {
                    analyzer: {
                        lowercase_analyzer: {
                            type: "custom",
                            filter: ["lowercase", "trim"],
                            tokenizer: "keyword"
                        }
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
                }
            }
        }
    }
});
