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
    } as any,
    mappings: {
        dynamic_templates: [
            {
                strings: {
                    match_mapping_type: "string",
                    mapping: {
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
        ],
        properties: {
            rawValues: {
                type: "object",
                enabled: false
            }
        }
    }
};
