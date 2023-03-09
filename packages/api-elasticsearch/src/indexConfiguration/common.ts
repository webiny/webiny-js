import { ElasticsearchIndexRequestBodyMappingsDynamicTemplate } from "~/types";

const getDefaultMappings = (): ElasticsearchIndexRequestBodyMappingsDynamicTemplate[] => {
    return [
        {
            dates: {
                match: "^createdOn|savedOn|publishedOn$",
                mapping: {
                    type: "date"
                }
            }
        },
        {
            numbers: {
                match: "number@*",
                mapping: {
                    type: "scaled_float",
                    scaling_factor: 10000,
                    fields: {
                        keyword: {
                            type: "keyword",
                            ignore_above: 256
                        }
                    }
                }
            }
        },
        {
            booleans: {
                match: "boolean@*",
                mapping: {
                    type: "boolean"
                }
            }
        }
    ];
};

interface Modifier {
    (
        mappings: ElasticsearchIndexRequestBodyMappingsDynamicTemplate[]
    ): ElasticsearchIndexRequestBodyMappingsDynamicTemplate[];
}

/**
 * @internal
 */
export const getCommonMappings = (
    cb?: Modifier
): ElasticsearchIndexRequestBodyMappingsDynamicTemplate[] => {
    if (!cb) {
        return getDefaultMappings();
    }

    return cb(getDefaultMappings());
};
