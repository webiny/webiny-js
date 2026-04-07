import type { CmsModelFieldToElasticsearchPlugin } from "~/types.js";

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-default",
    fieldType: "*",
    toIndex({ field, getFieldType, value }) {
        const fieldType = getFieldType(field.type);

        if (fieldType?.isSearchable === true) {
            return { value };
        }

        return { rawValue: value };
    },
    fromIndex({ field, getFieldType, value, rawValue }) {
        const fieldType = getFieldType(field.type);
        const isSearchable = fieldType?.isSearchable ?? false;
        /**
         * We will return the rawValue in case if not searchable and value in case of not searchable field.
         * This is to make sure that changed isSearchable parameter does not make the data to be null / undefined.
         *
         * Users can change isSearchable parameter at any time on the GraphQL field - and that could create a problem for them.
         */
        if (isSearchable) {
            return value === undefined ? rawValue : value;
        }
        return rawValue === undefined ? value : rawValue;
    }
});
