import { CmsModelFieldToElasticsearchPlugin } from "~/types";

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-default",
    fieldType: "*",
    toIndex({ field, getFieldTypePlugin, value }) {
        const fieldTypePlugin = getFieldTypePlugin(field.type);

        // when field is searchable, assign it to `values`
        if (fieldTypePlugin.isSearchable === true) {
            return { value };
        }

        // when field is not searchable, move its value to `rawValues`.
        // `rawValues` is a field in ES index that's not being indexed.
        return { rawValue: value };
    },
    fromIndex({ field, getFieldTypePlugin, value, rawValue }) {
        const { isSearchable } = getFieldTypePlugin(field.type);
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
