import pReduce from "p-reduce";
import pMap from "p-map";
import type { CmsModel, CmsModelField } from "~/types/index.js";
import { StorageTransform } from "../abstractions/StorageTransform.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import type { GenericRecord } from "@webiny/api/types.js";

interface ProcessValueParams {
    fields: CmsModelField[];
    sourceValue: GenericRecord;
    getStorageTransform: (fieldType: string) => StorageTransform.Interface;
    model: CmsModel;
    operation: "toStorage" | "fromStorage";
}
interface ProcessValue {
    (params: ProcessValueParams): Promise<GenericRecord>;
}

const processValue: ProcessValue = async params => {
    const { fields, sourceValue, getStorageTransform, model, operation } = params;
    return await pReduce(
        fields,
        async (values, field) => {
            const baseType = getBaseFieldType(field);
            const storageTransform = getStorageTransform(baseType);
            if (!storageTransform) {
                throw new Error(`Missing storage transform for field type "${baseType}".`);
            }
            const input = sourceValue[field.fieldId];
            const value = await storageTransform[operation]({
                model,
                field,
                value: input,
                getStorageTransform
            });
            return { ...values, [field.fieldId]: value };
        },
        {}
    );
};

class StorageTransformImpl implements StorageTransform.Interface {
    public readonly fieldType = "object";

    public async toStorage(
        params: StorageTransform.ToStorageParams
    ): StorageTransform.ToStorageResponse {
        const { value, field, getStorageTransform, model } = params;
        if (!value) {
            return null;
        }

        const fields = (field.settings?.fields || []) as CmsModelField[];

        if (field.list) {
            return await pMap(value as GenericRecord[], value =>
                processValue({
                    sourceValue: value,
                    getStorageTransform,
                    model,
                    operation: "toStorage",
                    fields
                })
            );
        }

        return await processValue({
            sourceValue: value,
            getStorageTransform,
            model,
            operation: "toStorage",
            fields
        });
    }

    public async fromStorage(
        params: StorageTransform.FromStorageParams
    ): StorageTransform.FromStorageResponse {
        const { field, value: input, getStorageTransform, model } = params;
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
                        getStorageTransform,
                        model,
                        operation: "fromStorage",
                        fields
                    });
                })
            );
        }

        return await processValue({
            sourceValue: input,
            getStorageTransform,
            model,
            operation: "fromStorage",
            fields
        });
    }
}

export const ObjectStorageTransform = StorageTransform.createImplementation({
    implementation: StorageTransformImpl,
    dependencies: []
});
