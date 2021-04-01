import { CmsModelFieldToElasticsearchPlugin } from "../../types";

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-rich-text",
    fieldType: "rich-text",
    toIndex(args) {
        const { toIndexEntry, field } = args;
        const values = toIndexEntry.values;
        const value = values[field.fieldId];
        // TODO: convert rich-text object to a searchable string to offer full-text search at some point

        // we are removing the field value from "values" because we do not want it indexed.
        delete values[field.fieldId];

        //
        return {
            values,
            rawValues: {
                ...(toIndexEntry.rawValues || {}),
                [field.fieldId]: value
            }
        };
    },
    fromIndex(args) {
        const { field, entry } = args;
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
