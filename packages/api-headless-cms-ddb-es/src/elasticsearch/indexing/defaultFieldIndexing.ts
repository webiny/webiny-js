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

        return isSearchable === true ? value : rawValue;
    }
});
