import { CmsModelFieldToElasticSearchPlugin } from "@webiny/api-headless-cms/types";

export default (): CmsModelFieldToElasticSearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-rich-text",
    fieldType: "rich-text",
    toIndex(args) {
        const { entry, value, field } = args;
        const values = entry.values;
        const rawData: Record<string, any> = {};
        const search: Record<string, any> = {};
        // we want to remove value key fieldId since we do not want it indexed by default
        delete values[field.fieldId];

        rawData[field.fieldId] = value;
        // TODO add search at some point

        //
        return {
            values,
            rawData,
            search
        };
    },
    fromIndex(args) {
        const { field, entry } = args;
        const rawData = (entry as any).rawData || {};
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
