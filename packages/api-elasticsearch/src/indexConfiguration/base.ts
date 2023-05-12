import { ElasticsearchIndexRequestBody } from "~/types";
import { getCommonMappings } from "./common";

const config: ElasticsearchIndexRequestBody = {
    mappings: {
        dynamic_templates: getCommonMappings(mappings => {
            return mappings.concat([
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
            ]);
        }),
        properties: {
            rawValues: {
                type: "object",
                enabled: false
            }
        }
    }
};

interface Modifier {
    (config: ElasticsearchIndexRequestBody): ElasticsearchIndexRequestBody;
}
export const getBaseConfiguration = (modifier?: Modifier) => {
    if (!modifier) {
        return config;
    }
    return modifier(config);
};
