import { FormElasticsearchIndexTemplatePlugin } from "~/plugins/FormElasticsearchIndexTemplatePlugin";

export const base = new FormElasticsearchIndexTemplatePlugin({
    name: "form-builder-forms-index-default",
    order: 150,
    body: {
        index_patterns: ["*-form-builder"],
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
