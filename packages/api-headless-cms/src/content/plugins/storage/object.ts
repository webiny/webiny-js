import pReduce from "p-reduce";
import pMap from "p-map";
import { CmsModel, CmsModelField } from "~/types";
import { StorageTransformPlugin } from "./StorageTransformPlugin";
import { PluginsContainer } from "@webiny/plugins";

interface ProcessValue {
    (params: {
        fields: CmsModelField[];
        sourceValue: Record<string, any>;
        getStoragePlugin: (fieldType: string) => StorageTransformPlugin;
        plugins: PluginsContainer;
        model: CmsModel;
        operation: string;
    }): Promise<Record<string, any>>;
}

const processValue: ProcessValue = async ({
    fields,
    sourceValue,
    getStoragePlugin,
    plugins,
    model,
    operation
}) => {
    return await pReduce(
        fields,
        async (values, field) => {
            const plugin = getStoragePlugin(field.type);
            if (!plugin) {
                throw new Error(`Missing storage plugin for field type "${field.type}".`);
            }
            const value = await plugin[operation]({
                plugins,
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

const plugin = new StorageTransformPlugin({
    fieldType: "object",
    toStorage: async ({ field, value, getStoragePlugin, model, plugins }) => {
        if (!value) {
            return null;
        }

        const fields = field.settings.fields as CmsModelField[];

        if (field.multipleValues) {
            return await pMap(value as Record<string, any>[], value =>
                processValue({
                    sourceValue: value,
                    getStoragePlugin,
                    model,
                    plugins,
                    operation: "toStorage",
                    fields
                })
            );
        }

        return processValue({
            sourceValue: value,
            getStoragePlugin,
            model,
            plugins,
            operation: "toStorage",
            fields
        });
    },
    fromStorage: async ({ field, value, getStoragePlugin, plugins, model }) => {
        if (!value) {
            return null;
        }

        const fields = field.settings.fields as CmsModelField[];

        if (field.multipleValues) {
            return pMap(value as Record<string, any>[], value =>
                processValue({
                    sourceValue: value,
                    getStoragePlugin,
                    model,
                    plugins,
                    operation: "fromStorage",
                    fields
                })
            );
        }

        return processValue({
            sourceValue: value,
            getStoragePlugin,
            model,
            plugins,
            operation: "fromStorage",
            fields
        });
    }
});

export default (): StorageTransformPlugin => {
    return plugin;
};
