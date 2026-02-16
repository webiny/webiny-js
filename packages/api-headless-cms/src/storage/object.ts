import pReduce from "p-reduce";
import pMap from "p-map";
import type { CmsModel, CmsModelField } from "~/types/index.js";
import type { PluginsContainer } from "@webiny/plugins";
import { StorageTransformPlugin } from "~/plugins/StorageTransformPlugin.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import type { GenericRecord } from "@webiny/api/types.js";

interface ProcessValueParams {
    fields: CmsModelField[];
    sourceValue: GenericRecord;
    getStoragePlugin: (fieldType: string) => StorageTransformPlugin;
    plugins: PluginsContainer;
    model: CmsModel;
    operation: "toStorage" | "fromStorage";
}
interface ProcessValue {
    (params: ProcessValueParams): Promise<GenericRecord>;
}

const processValue: ProcessValue = async params => {
    const { fields, sourceValue, getStoragePlugin, plugins, model, operation } = params;
    return await pReduce(
        fields,
        async (values, field) => {
            const baseType = getBaseFieldType(field);
            const plugin = getStoragePlugin(baseType);
            if (!plugin) {
                throw new Error(`Missing storage plugin for field type "${baseType}".`);
            }
            const input = sourceValue[field.fieldId];
            const value = await plugin[operation]({
                plugins,
                model,
                field,
                value: input,
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

            if (field.list) {
                return await pMap(value as GenericRecord[], value =>
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
        fromStorage: async ({ field, value: input, getStoragePlugin, plugins, model }) => {
            if (!input) {
                return null;
            }

            const fields = (field.settings?.fields || []) as CmsModelField[];

            if (field.list) {
                const values = input as GenericRecord[];

                return await Promise.all(
                    values.map(async value => {
                        return await processValue({
                            sourceValue: value,
                            getStoragePlugin,
                            model,
                            plugins,
                            operation: "fromStorage",
                            fields
                        });
                    })
                );
            }

            return await processValue({
                sourceValue: input,
                getStoragePlugin,
                model,
                plugins,
                operation: "fromStorage",
                fields
            });
        }
    });
};
