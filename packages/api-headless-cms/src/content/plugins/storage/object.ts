import pReduce from "p-reduce";
import pMap from "p-map";
import {
    CmsContentModel,
    CmsContentModelField,
    CmsContext,
    CmsModelFieldToStoragePlugin
} from "~/types";

interface ProcessValue {
    (params: {
        fields: CmsContentModelField[];
        sourceValue: Record<string, any>;
        getStoragePlugin: (fieldType: string) => CmsModelFieldToStoragePlugin;
        context: CmsContext;
        model: CmsContentModel;
        operation: string;
    }): Promise<Record<string, any>>;
}

const processValue: ProcessValue = async ({
    fields,
    sourceValue,
    getStoragePlugin,
    context,
    model,
    operation
}) => {
    return await pReduce(
        fields,
        async (values, field) => {
            const plugin = getStoragePlugin(field.type);
            const value = await plugin[operation]({
                context,
                model,
                field,
                value: sourceValue[field.fieldId],
                getStoragePlugin
            });
            return { ...values, [field.fieldId]: value };
        },
        {}
    );
};

export default (): CmsModelFieldToStoragePlugin => ({
    type: "cms-model-field-to-storage",
    name: "cms-model-field-to-storage-object",
    fieldType: "object",
    async fromStorage({ field, value, getStoragePlugin, context, model }) {
        if (!value) {
            return null;
        }

        const fields = field.settings.fields as CmsContentModelField[];

        if (field.multipleValues) {
            return pMap(value as Record<string, any>[], value =>
                processValue({
                    sourceValue: value,
                    getStoragePlugin,
                    model,
                    context,
                    operation: "fromStorage",
                    fields
                })
            );
        }

        return processValue({
            sourceValue: value,
            getStoragePlugin,
            model,
            context,
            operation: "fromStorage",
            fields
        });
    },
    async toStorage({ field, value, getStoragePlugin, model, context }) {
        if (!value) {
            return null;
        }

        const fields = field.settings.fields as CmsContentModelField[];

        if (field.multipleValues) {
            const mValues = await pMap(value as Record<string, any>[], value =>
                processValue({
                    sourceValue: value,
                    getStoragePlugin,
                    model,
                    context,
                    operation: "toStorage",
                    fields
                })
            );

            return mValues;
        }

        return processValue({
            sourceValue: value,
            getStoragePlugin,
            model,
            context,
            operation: "toStorage",
            fields
        });
    }
});
