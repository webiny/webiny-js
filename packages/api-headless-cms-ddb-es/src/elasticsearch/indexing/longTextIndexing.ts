import { CmsModelFieldToElasticsearchPlugin } from "~/types";

/**
 * The long-text indexing plugin must take in consideration that users might have list of long-text fields.
 * Also, we used to encode values, and we do not do that anymore - but we need to have backward compatibility.
 */
export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-long-text",
    fieldType: "long-text",
    toIndex({ rawValue }) {
        /**
         * We take the raw value, before it was prepared via `transformToStorage` for storage (there might be some transform due to DynamoDB) and store it in the Elasticsearch to be indexed.
         */
        return {
            value: Array.isArray(rawValue) ? rawValue : rawValue || ""
        };
    },
    /**
     * When taking value from the index, we can return the original value.
     * At that point the `transformFromStorage` does not need to do anything.
     *
     * We need to decode to support older systems.
     */
    fromIndex({ value }) {
        if (Array.isArray(value)) {
            return value;
        }
        return value || "";
    }
});
