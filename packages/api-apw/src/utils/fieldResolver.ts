import pick from "lodash/pick";
import { CmsContext, CmsModel } from "@webiny/api-headless-cms/types";
import { entryFieldFromStorageTransform } from "@webiny/api-headless-cms/content/plugins/utils/entryStorage";

interface Transformer {
    fieldId: string;
    model: any;
    field: any;
}

interface GetFieldValuesParams {
    entry: Record<string, any>;
    fields: string[];
    transformers?: Transformer[];
    context: CmsContext;
}

export const getFieldValues = async (params: GetFieldValuesParams) => {
    const { entry, context, transformers = [], fields } = params;
    const values = { ...pick(entry, fields), ...entry.values };
    /**
     * Transform field value for each transformers.
     */
    for (let i = 0; i < transformers.length; i++) {
        const { fieldId, model, field } = transformers[i];
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
    fieldId,
    model: model,
    field: model.fields.find(field => field.fieldId === fieldId)
});
