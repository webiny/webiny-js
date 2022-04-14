import { ElasticsearchIndexRequestBody } from "~/types";

export const base: ElasticsearchIndexRequestBody = {
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
            },
            rawValues: {
                type: "object",
                enabled: false
            }
        }
    }
};
