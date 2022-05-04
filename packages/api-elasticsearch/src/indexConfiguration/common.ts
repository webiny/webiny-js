import { ElasticsearchIndexRequestBodyMappingsDynamicTemplate } from "~/types";

/**
 * @internal
 */
export const dynamicTemplateDates: ElasticsearchIndexRequestBodyMappingsDynamicTemplate[] = [
    {
        dates: {
            match: "^createdOn|savedOn|publishedOn$",
            mapping: {
                type: "date"
            }
        }
    }
];
