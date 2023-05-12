import pick from "lodash/pick";
import { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { entryFieldFromStorageTransform } from "@webiny/api-headless-cms";
import { AcoBaseFields } from "~/types";

interface Transformer {
    fieldId: keyof AcoBaseFields;
    model: any;
    field: any;
}

interface GetFieldValuesParams {
    entry: CmsEntry;
    fields: string[];
    transformers?: Transformer[];
    context: CmsContext;
}

export const getFieldValues = async <T extends AcoBaseFields>(
    params: GetFieldValuesParams
): Promise<T> => {
    const { entry, context, transformers = [], fields } = params;
    const values = {
        ...pick(entry, fields),
        ...entry.values
    } as T;
    /**
     * Transform field value for each transformers.
     */
    for (const transformer of transformers) {
        const { fieldId, model, field } = transformer;
        // Get transformed value (eg. data decompression)
        values[fieldId] = await entryFieldFromStorageTransform({
            context,
            model,
            field,
            value: values[fieldId]
        });
    }

    return values;
};

export const getTransformer = (model: CmsModel, fieldId: string): Transformer => ({
    fieldId: fieldId as unknown as keyof AcoBaseFields,
    model: model,
    field: model.fields.find(field => field.fieldId === fieldId)
});
