import { CmsModelFieldToElasticsearchPlugin } from "../../types";

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-default",
    fieldType: "*",
    toIndex(args) {
        const { field, toIndexEntry, fieldTypePlugin } = args;
        // when field is searchable - do nothing
        if (fieldTypePlugin.isSearchable === true) {
            return {};
        }
        const values = toIndexEntry.values;
        const value = values[field.fieldId];

        // we are removing the field value from "values" because we do not want it indexed.
        delete values[field.fieldId];

        return {
            values,
            rawValues: {
                ...(toIndexEntry.rawValues || {}),
                [field.fieldId]: value
            }
        };
    },
    fromIndex(args) {
        const { field, entry, fieldTypePlugin } = args;
        // when field is searchable - do nothing
        if (fieldTypePlugin.isSearchable === true) {
            return {};
        }

        const rawValues = entry.rawValues || {};
        const value = rawValues[field.fieldId];
        // we want to remove rawValues so next plugin does not run some action because of it
        delete rawValues[field.fieldId];

        return {
            values: {
                ...(entry.values || {}),
                [field.fieldId]: value
            },
            rawValues
        };
    }
});
