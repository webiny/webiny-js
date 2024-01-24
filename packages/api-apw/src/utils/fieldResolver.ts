import { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { entryFieldFromStorageTransform } from "@webiny/api-headless-cms";
import { ApwBaseFields } from "~/types";
import { pickEntryFieldValues } from "~/utils/pickEntryFieldValues";

interface Transformer {
    fieldId: keyof ApwBaseFields;
    model: any;
    field: any;
}

interface GetFieldValuesParams {
    entry: CmsEntry;
    fields: string[];
    transformers?: Transformer[];
    context: CmsContext;
}

export const getFieldValues = async <T extends ApwBaseFields>(
    params: GetFieldValuesParams
): Promise<T> => {
    const { entry, context, transformers = [] } = params;

    const values = pickEntryFieldValues<T>(entry);

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
    fieldId: fieldId as unknown as keyof ApwBaseFields,
    model: model,
    field: model.fields.find(field => field.fieldId === fieldId)
});
