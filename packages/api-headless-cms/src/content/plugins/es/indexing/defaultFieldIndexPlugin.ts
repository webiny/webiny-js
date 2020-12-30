import { CmsModelFieldToElasticSearchPlugin } from "@webiny/api-headless-cms/types";

export default (): CmsModelFieldToElasticSearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-default",
    fieldType: "*",
    toIndex(args) {
        const { field, entry, value, fieldTypePlugin } = args;
        // when field is searchable - do nothing
        if (fieldTypePlugin.isSearchable === true) {
            return {};
        }
        const values = entry.values;
        // we want to remove value key fieldId since we do not want it indexed by default
        delete values[field.fieldId];
        const rawData = {
            [field.fieldId]: value
        };
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
        const rawFieldData = rawData[field.fieldId];
        // we want to remove rawData so next plugin does not run some action because of it
        delete rawData[field.fieldId];
        return {
            values: {
                [field.fieldId]: rawFieldData
            },
            rawData
        };
    }
});
