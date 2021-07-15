import { CmsModelFieldToElasticsearchPlugin } from "~/types";

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-long-text",
    fieldType: "long-text",
    toIndex(args) {
        const { toIndexEntry, field, originalEntry } = args;
        const values = toIndexEntry.values;
        const value = values[field.fieldId];

        return {
            values: {
                ...values,
                // Save the original entry value to make the field searchable
                [field.fieldId]: originalEntry.values[field.fieldId]
            },
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
        /**
         * To handle backward compatibility;
         * there might be some entries where the indexed entry doesn't have any "rawValues"
         */
        if (!value) {
            return {
                values: {
                    ...(entry.values || {})
                },
                rawValues
            };
        }

        return {
            values: {
                ...(entry.values || {}),
                [field.fieldId]: value
            },
            rawValues
        };
    }
});
