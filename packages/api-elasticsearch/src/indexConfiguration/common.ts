import { ElasticsearchIndexRequestBodyMappingsDynamicTemplate } from "~/types";

/**
 * @internal
 */
export const common: ElasticsearchIndexRequestBodyMappingsDynamicTemplate[] = [
    {
        dates: {
            match: "^createdOn|savedOn|publishedOn$",
            mapping: {
                type: "date"
            }
        }
    }
];
