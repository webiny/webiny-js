import type { OpenSearchIndexRequestBodyMappingsDynamicTemplate } from "~/types.js";

const getDefaultMappings = (): OpenSearchIndexRequestBodyMappingsDynamicTemplate[] => {
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
        mappings: OpenSearchIndexRequestBodyMappingsDynamicTemplate[]
    ): OpenSearchIndexRequestBodyMappingsDynamicTemplate[];
}
/**
 * @internal
 */
export const getCommonMappings = (
    cb?: Modifier
): OpenSearchIndexRequestBodyMappingsDynamicTemplate[] => {
    if (!cb) {
        return getDefaultMappings();
    }

    return cb(getDefaultMappings());
};
