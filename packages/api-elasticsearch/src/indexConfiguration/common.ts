import { ElasticsearchIndexRequestBodyMappingsDynamicTemplate } from "~/types";

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
