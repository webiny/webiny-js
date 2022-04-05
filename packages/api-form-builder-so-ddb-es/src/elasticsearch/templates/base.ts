import { FormElasticsearchIndexTemplatePlugin } from "~/plugins/FormElasticsearchIndexTemplatePlugin";

export const base = new FormElasticsearchIndexTemplatePlugin({
    template: {
        name: "form-builder-forms-index-default",
        order: 50,
        body: {
            index_patterns: ["*-form-builder"],
            /**
             * need this part for sorting to work on text fields
             */
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
