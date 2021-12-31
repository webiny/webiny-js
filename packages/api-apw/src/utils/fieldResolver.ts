import { entryFieldFromStorageTransform } from "@webiny/api-headless-cms/content/plugins/utils/entryStorage";
import { FieldResolverParams } from "~/types";

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

export const generateFieldResolvers = (fieldIds: Array<FieldResolverParams>) => {
    return fieldIds.reduce((previousValue, currentValue) => {
        const { fieldId } = currentValue;

        if (typeof previousValue[fieldId] !== "function") {
            previousValue[fieldId] = resolveFieldValueWithTransform({
                ...currentValue
            });
        }
        return previousValue;
    }, {});
};
