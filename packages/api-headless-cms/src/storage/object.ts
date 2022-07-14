import pReduce from "p-reduce";
import pMap from "p-map";
import { CmsModel, CmsModelField } from "~/types";
import { PluginsContainer } from "@webiny/plugins";
import { StorageTransformPlugin } from "~/plugins/StorageTransformPlugin";

interface ProcessValueParams {
    fields: CmsModelField[];
    sourceValue: Record<string, any>;
    getStoragePlugin: (fieldType: string) => StorageTransformPlugin;
    plugins: PluginsContainer;
    model: CmsModel;
    operation: "toStorage" | "fromStorage";
}
interface ProcessValue {
    (params: ProcessValueParams): Promise<Record<string, any>>;
}

const processValue: ProcessValue = async params => {
    const { fields, sourceValue, getStoragePlugin, plugins, model, operation } = params;
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

export const createObjectStorageTransform = (): StorageTransformPlugin => {
    return new StorageTransformPlugin({
        name: "headless-cms.storage-transform.object.default",
        fieldType: "object",
        toStorage: async ({ field, value, getStoragePlugin, model, plugins }) => {
            if (!value) {
                return null;
            }

            const fields = (field.settings?.fields || []) as CmsModelField[];

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

            return await processValue({
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

            const fields = (field.settings?.fields || []) as CmsModelField[];

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
};
