import { CmsModelFieldToElasticSearchPlugin } from "@webiny/api-headless-cms/types";

export default (): CmsModelFieldToElasticSearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-rich-text",
    fieldType: "rich-text",
    toIndex(args) {
        const { storageEntry, field } = args;
        const values = storageEntry.values;

        const rawData: Record<string, any> = { [field.fieldId]: values[field.fieldId] };

        // TODO: convert rich-text object to a searchable string to offer full-text search at some point

        // we are removing the field value from "values" because we do not want it indexed.
        delete values[field.fieldId];

        //
        return {
            values,
            rawData
        };
    },
    fromIndex(args) {
        const { field, entry } = args;
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
