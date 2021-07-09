import { CmsModelFieldToElasticsearchPlugin } from "~/types";
import { CmsContentModelField } from "@webiny/api-headless-cms/types";

export default (): CmsModelFieldToElasticsearchPlugin => ({
    type: "cms-model-field-to-elastic-search",
    name: "cms-model-field-to-elastic-search-rich-text",
    fieldType: "rich-text",
    toIndex({ field, fieldPath, getValue, getFieldIndexPlugin, ...params }) {
        // we are removing the field value from "values" because we do not want it indexed.
        // delete values[field.fieldId];
        const childFields: CmsContentModelField[] = field.settings.fields;

        const values = {};
        const rawValues = { [fieldPath]: getValue(fieldPath) };

        for (const f of childFields) {
            const fromIndex = getFieldIndexPlugin(f.type).toIndex({
                field: f,
                fieldPath: `${fieldPath}.${f.fieldId}`,
                getValue,
                getFieldIndexPlugin,
                ...params
            });

            Object.assign(values, fromIndex.values || {});
            Object.assign(rawValues, fromIndex.rawValues || {});
        }

        return { values, rawValues };
    },
    fromIndex({ field, fieldPath, getRawValue, getFieldIndexPlugin, ...params }) {
        const childFields: CmsContentModelField[] = field.settings.fields;

        const values = { [fieldPath]: getRawValue(fieldPath) };
        const rawValues = {};

        for (const f of childFields) {
            const fromIndex = getFieldIndexPlugin(f.type).fromIndex({
                field: f,
                fieldPath: `${fieldPath}.${f.fieldId}`,
                getRawValue,
                getFieldIndexPlugin,
                ...params
            });

            Object.assign(values, fromIndex.values || {});
            Object.assign(rawValues, fromIndex.rawValues || {});
        }

        return { values, rawValues };
    }
});
