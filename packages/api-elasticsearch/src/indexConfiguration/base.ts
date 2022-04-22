import { ElasticsearchIndexRequestBody } from "~/types";

export const base: ElasticsearchIndexRequestBody = {
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
