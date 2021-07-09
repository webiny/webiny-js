import { CmsModelFieldToElasticsearchPlugin } from "~/types";

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-default",
    fieldType: "*",
    toIndex({ field, fieldPath, getFieldIndexPlugin, getValue }) {
        const fieldTypePlugin = getFieldIndexPlugin(field.type);

        // when field is searchable, assign it to `values`
        if (fieldTypePlugin.isSearchable === true) {
            return {
                values: {
                    [fieldPath]: getValue(fieldPath)
                }
            };
        }

        // when field is not searchable, move its value to `rawValues`.
        // `rawValues` is a field in ES index that's not being indexed.
        return {
            rawValues: {
                [fieldPath]: getValue(fieldPath)
            }
        };
    },
    fromIndex({ field, fieldPath, getFieldIndexPlugin, getValue, getRawValue }) {
        const { isSearchable } = getFieldIndexPlugin(field.type);

        return {
            values: {
                [fieldPath]: isSearchable === true ? getValue(fieldPath) : getRawValue(fieldPath)
            }
        };
    }
});
