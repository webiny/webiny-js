import lodashSet from "lodash.set";
import { CmsContentModelField, CmsModelFieldToStoragePlugin } from "~/types";

export default (): CmsModelFieldToStoragePlugin => ({
    type: "cms-model-field-to-storage",
    name: "cms-model-field-to-storage-object",
    fieldType: "object",
    async fromStorage({ field, fieldPath, getValue, getStoragePlugin, context, model }) {
        const transformedValues = {};

        const fields = field.settings.fields as CmsContentModelField[];
        for (const f of fields) {
            const plugin = getStoragePlugin(f.type);

            const { values } = await plugin.fromStorage({
                context,
                model,
                field: f,
                fieldPath: `${fieldPath}.${f.fieldId}`,
                getValue,
                getStoragePlugin
            });

            Object.keys(values).forEach(key => {
                lodashSet(transformedValues, key, values[key]);
            });
        }

        return {
            values: transformedValues
        };
    },
    async toStorage({ field, fieldPath, getValue, getStoragePlugin, model, context }) {
        const transformedValues = {};

        const fields = field.settings.fields as CmsContentModelField[];
        for (const f of fields) {
            const plugin = getStoragePlugin(f.type);

            const { values } = await plugin.toStorage({
                context,
                model,
                field: f,
                fieldPath: `${fieldPath}.${f.fieldId}`,
                getValue,
                getStoragePlugin
            });

            Object.keys(values).forEach(key => {
                lodashSet(transformedValues, key, values[key]);
            });
        }

        return {
            values: transformedValues
        };
    }
});
