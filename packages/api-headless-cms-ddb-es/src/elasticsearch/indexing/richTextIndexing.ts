import { CmsModelFieldToElasticsearchPlugin } from "~/types";

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-rich-text",
    fieldType: "rich-text",
    toIndex({ value }) {
        // TODO: convert rich-text object to a searchable string to offer full-text search at some point

        /**
         * We want to store rich-text value as a "rawValue", meaning it wont' be indexed by ES.
         */
        return {
            rawValue: value
        };
    },
    fromIndex({ rawValue }) {
        return rawValue;
    }
});
