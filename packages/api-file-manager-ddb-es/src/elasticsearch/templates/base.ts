import { FileElasticsearchIndexTemplatePlugin } from "~/plugins/FileElasticsearchIndexTemplatePlugin";

export const base = new FileElasticsearchIndexTemplatePlugin({
    name: "file-manager-files-index-default",
    body: {
        index_patterns: ["*-file-manager"],
        priority: 50,
        template: {
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
