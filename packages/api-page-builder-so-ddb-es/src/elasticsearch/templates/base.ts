import { PageElasticsearchIndexTemplatePlugin } from "~/plugins/definitions/PageElasticsearchIndexTemplatePlugin";

export const base = new PageElasticsearchIndexTemplatePlugin({
    name: "page-builder-pages-index-default",
    body: {
        priority: 350,
        index_patterns: ["*-page-builder"],
        template: {
            // need this part for sorting to work on text fields
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
                    }
                }
            }
        }
    }
});
