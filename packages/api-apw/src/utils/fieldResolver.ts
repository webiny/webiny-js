import { entryFieldFromStorageTransform } from "@webiny/api-headless-cms/content/plugins/utils/entryStorage";
import { FieldResolversParams } from "~/types";

const resolveFieldValue = (parent, _, __, info) => {
    const { fieldName } = info;
    return parent.values[fieldName];
};

const resolveFieldValueWithTransform =
    ({ getModel, getField, isRoot }) =>
    async (parent, _, context, info) => {
        const { fieldName } = info;
        const model = await getModel(context);

        const field = getField(model, fieldName);

        // Get transformed value (eg. data decompression)
        return await entryFieldFromStorageTransform({
            context,
            model,
            field,
            value: isRoot ? parent.values[fieldName] : parent[fieldName]
        });
    };

export const generateFieldResolvers = (fieldIds: Array<string | FieldResolversParams>) => {
    return fieldIds.reduce((previousValue, currentValue) => {
        const fieldId = typeof currentValue !== "string" ? currentValue.fieldId : currentValue;

        if (typeof previousValue[fieldId] !== "function") {
            if (typeof currentValue !== "string") {
                previousValue[fieldId] = resolveFieldValueWithTransform({
                    ...currentValue
                });
            } else {
                previousValue[fieldId] = resolveFieldValue;
            }
        }
        return previousValue;
    }, {});
};
