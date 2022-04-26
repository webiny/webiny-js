import { FileElasticsearchIndexTemplatePlugin } from "~/plugins/FileElasticsearchIndexTemplatePlugin";

export const base = new FileElasticsearchIndexTemplatePlugin({
    name: "file-manager-files-index-default",
    order: 50,
    body: {
        index_patterns: ["*-file-manager"],
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
});
