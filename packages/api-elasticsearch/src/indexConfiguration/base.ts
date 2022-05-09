import { ElasticsearchIndexRequestBody } from "~/types";
import { dynamicTemplateDates } from "./common";

export const base: ElasticsearchIndexRequestBody = {
    mappings: {
        dynamic_templates: dynamicTemplateDates.concat([
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
        ]),
        properties: {
            rawValues: {
                type: "object",
                enabled: false
            }
        }
    }
};
