import { CmsModelFieldToElasticsearchPlugin } from "~/types";

export const createJsonIndexing = (): CmsModelFieldToElasticsearchPlugin => {
    return {
        type: "cms-model-field-to-elastic-search",
        name: "cms-model-field-to-elastic-search-json",
        fieldType: "json",
        toIndex({ value }) {
            return {
                rawValue: value
            };
        },
        fromIndex({ rawValue }) {
            return rawValue;
        }
    };
};
