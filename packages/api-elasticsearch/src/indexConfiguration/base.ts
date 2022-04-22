import { ElasticsearchIndexRequestBody } from "~/types";

export const base: ElasticsearchIndexRequestBody = {
    // settings: {
    //     analysis: {
    //         analyzer: {
    //             lowercase_analyzer: {
    //                 type: "custom",
    //                 filter: ["up_to_256_chars", "lowercase", "trim"],
    //                 tokenizer: "keyword"
    //             }
    //         },
    //         filter: {
    //             up_to_256_chars: {
    //                 type: "length",
    //                 max: 256
    //             }
    //         }
    //     }
    // },
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
                        }
                        // search_analyzer: "standard_search_analyzer",
                        // analyzer: "standard_search_analyzer"
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
