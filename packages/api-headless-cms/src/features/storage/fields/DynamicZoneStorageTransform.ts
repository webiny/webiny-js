import { StorageTransform } from "../abstractions/StorageTransform.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { CmsModel, CmsModelDynamicZoneField } from "~/types/index.js";
import pReduce from "p-reduce";

interface IProcessParams {
    model: CmsModel;
    field: CmsModelDynamicZoneField;
    value: GenericRecord;
    getStorageTransform: (fieldType: string) => StorageTransform.Interface;
}

const processToStorage = async (params: IProcessParams): Promise<GenericRecord> => {
    const { model, field: parentField, value: input, getStorageTransform } = params;

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
            const storageTransform = getStorageTransform(field.type);
            if (!storageTransform) {
                console.error(`Missing storage transform for field type "${field.type}".`);
                delete values[field.fieldId];
                return values;
            }
            values[field.fieldId] = await storageTransform.toStorage({
                getStorageTransform,
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
    const { model, field: parentField, value: input, getStorageTransform } = params;

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
            const storageTransform = getStorageTransform(field.type);
            if (!storageTransform) {
                console.error(`Missing storage transform for field type "${field.type}".`);
                delete values[field.fieldId];
                return values;
            }
            values[field.fieldId] = await storageTransform.fromStorage({
                getStorageTransform,
                model,
                field,
                value
            });

            return values;
        },
        output
    );
};

class DynamicZoneStorageTransformImpl implements StorageTransform.Interface {
    public readonly fieldType = "dynamicZone";

    public async toStorage(
        params: StorageTransform.ToStorageParams
    ): StorageTransform.ToStorageResponse {
        const { value: input, field, model, getStorageTransform } = params;
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
                        getStorageTransform
                    });
                })
            );
        }
        return await processToStorage({
            model,
            field: field as CmsModelDynamicZoneField,
            value: input,
            getStorageTransform
        });
    }

    public async fromStorage(
        params: StorageTransform.FromStorageParams
    ): StorageTransform.FromStorageResponse {
        const { value: input, field, model, getStorageTransform } = params;
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
                        getStorageTransform
                    });
                })
            );
        }
        return await processFromStorage({
            model,
            field: field as CmsModelDynamicZoneField,
            value: input,
            getStorageTransform
        });
    }
}

export const DynamicZoneStorageTransform = StorageTransform.createImplementation({
    implementation: DynamicZoneStorageTransformImpl,
    dependencies: []
});
