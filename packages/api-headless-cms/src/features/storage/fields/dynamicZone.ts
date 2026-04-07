import type { ToStorageParams } from "~/plugins/index.js";
import { StorageTransformPlugin } from "~/plugins/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { CmsModel, CmsModelDynamicZoneField, CmsModelField } from "~/types/index.js";
import type { PluginsContainer } from "@webiny/plugins";
import pReduce from "p-reduce";

interface IProcessParams {
    model: CmsModel;
    field: CmsModelDynamicZoneField;
    value: GenericRecord;
    getStoragePlugin: ToStorageParams<GenericRecord, CmsModelField>["getStoragePlugin"];
    plugins: PluginsContainer;
}

const processToStorage = async (params: IProcessParams): Promise<GenericRecord> => {
    const { model, field: parentField, value: input, getStoragePlugin, plugins } = params;

    const output: GenericRecord = structuredClone(input);

    if (!output._templateId) {
        return output;
    }
    const template = parentField.settings.templates.find(t => t.id === output._templateId);
    if (!template || !template.fields.length) {
        return output;
    }

    return await pReduce(
        template.fields,
        async (values, field) => {
            const value = values[field.fieldId];

            if (!value) {
                values[field.fieldId] = value;
                return values;
            }
            const plugin = getStoragePlugin(field.type);
            if (!plugin) {
                console.error(`Missing storage plugin for field type "${field.type}".`);
                delete values[field.fieldId];
                return values;
            }
            values[field.fieldId] = await plugin.toStorage({
                plugins,
                getStoragePlugin,
                model,
                field,
                value
            });

            return values;
        },
        output
    );
};

const processFromStorage = async (params: IProcessParams): Promise<GenericRecord> => {
    const { model, field: parentField, value: input, getStoragePlugin, plugins } = params;

    const output: GenericRecord = structuredClone(input);

    if (!output._templateId) {
        return output;
    }
    const template = parentField.settings.templates.find(t => t.id === output._templateId);
    if (!template || !template.fields.length) {
        return output;
    }

    return await pReduce(
        template.fields,
        async (values, field) => {
            const value = values[field.fieldId];

            if (!value) {
                return values;
            }
            const plugin = getStoragePlugin(field.type);
            if (!plugin) {
                console.error(`Missing storage plugin for field type "${field.type}".`);
                delete values[field.fieldId];
                return values;
            }
            values[field.fieldId] = await plugin.fromStorage({
                plugins,
                getStoragePlugin,
                model,
                field,
                value
            });

            return values;
        },
        output
    );
};

export const createDynamicZoneStorageTransform = (): StorageTransformPlugin => {
    return new StorageTransformPlugin({
        name: "headless-cms.storage-transform.dynamicZone.default",
        fieldType: "dynamicZone",
        toStorage: async ({ field, value: input, getStoragePlugin, model, plugins }) => {
            if (!input) {
                return input;
            } else if (field.list) {
                if (!Array.isArray(input)) {
                    return input;
                }
                const values = input as GenericRecord[];
                return Promise.all(
                    values.map(async value => {
                        return await processToStorage({
                            model,
                            field: field as CmsModelDynamicZoneField,
                            value,
                            getStoragePlugin,
                            plugins
                        });
                    })
                );
            }
            return await processToStorage({
                model,
                field: field as CmsModelDynamicZoneField,
                value: input,
                getStoragePlugin,
                plugins
            });
        },
        fromStorage: async ({ field, value: input, getStoragePlugin, model, plugins }) => {
            if (!input) {
                return input;
            } else if (field.list) {
                if (!Array.isArray(input)) {
                    return input;
                }
                const values = input as GenericRecord[];

                return await Promise.all(
                    values.map(async value => {
                        return await processFromStorage({
                            model,
                            field: field as CmsModelDynamicZoneField,
                            value,
                            getStoragePlugin,
                            plugins
                        });
                    })
                );
            }
            return await processFromStorage({
                model,
                field: field as CmsModelDynamicZoneField,
                value: input,
                getStoragePlugin,
                plugins
            });
        }
    });
};
