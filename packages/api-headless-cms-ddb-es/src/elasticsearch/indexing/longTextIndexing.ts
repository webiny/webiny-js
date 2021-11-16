import { CmsModelFieldToElasticsearchPlugin } from "~/types";

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-long-text",
    fieldType: "long-text",
    toIndex({ rawValue }) {
        /**
         * We want to store the value (rawValue) from entry before it was prepared for storage as value to be searched on.
         * And we want to store prepared value into rawValue so it is not indexed.
         */
        return {
            value: rawValue ? encodeURIComponent(rawValue) : null
        };
    },
    /**
     * When extracting from index, we can return the value that was stored to be searched - and then no decompression will be required.
     */
    fromIndex({ value }) {
        return value ? decodeURIComponent(value) : null;
    }
});
