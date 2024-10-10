import { ElasticsearchIndexRequestBodyMappingsDynamicTemplate } from "~/types";

const getDefaultMappings = (): ElasticsearchIndexRequestBodyMappingsDynamicTemplate[] => {
    return [
        {
            ids: {
                match: "^id|entryId$",
                mapping: {
                    type: "string",
                    keyword: true
                }
            }
        },
        {
            /**
             * Update with the correct date fields.
             */
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
                    scaling_factor: 10000
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
