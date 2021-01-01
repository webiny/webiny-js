import { CmsModelFieldToElasticSearchPlugin } from "@webiny/api-headless-cms/types";

export default (): CmsModelFieldToElasticSearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-default",
    fieldType: "*",
    toIndex(args) {
        const { field, storageEntry, fieldTypePlugin } = args;
        // when field is searchable - do nothing
        if (fieldTypePlugin.isSearchable === true) {
            return {};
        }
        const values = storageEntry.values;
        const rawData = {
            [field.fieldId]: values[field.fieldId]
        };

        // we are removing the field value from "values" because we do not want it indexed.
        delete values[field.fieldId];

        return {
            values,
            rawData
        };
    },
    fromIndex(args) {
        const { field, entry, fieldTypePlugin } = args;
        // when field is searchable - do nothing
        if (fieldTypePlugin.isSearchable === true) {
            return {};
        }

        const rawData = entry.rawData || {};
        const value = rawData[field.fieldId];
        delete rawData[field.fieldId];

        return {
            values: { [field.fieldId]: value },
            rawData
        };
    }
});
