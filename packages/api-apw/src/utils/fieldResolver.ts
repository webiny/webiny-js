import pick from "lodash/pick";
import { CmsContext, CmsEntry, CmsModel } from "@webiny/api-headless-cms/types";
import { entryFieldFromStorageTransform } from "@webiny/api-headless-cms";
import { ApwBaseFields } from "~/types";

interface Transformer {
    alias: keyof ApwBaseFields;
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
    const { entry, context, transformers = [], fields } = params;
    const values = {
        ...pick(entry, fields),
        ...entry.values
    } as T;
    /**
     * Transform field value for each transformers.
     */
    for (const transformer of transformers) {
        const { alias, model, field } = transformer;
        // Get transformed value (eg. data decompression)
        values[alias] = await entryFieldFromStorageTransform({
            context,
            model,
            field,
            value: values[alias]
        });
    }

    return values;
};

export const getTransformer = (model: CmsModel, alias: string): Transformer => ({
    alias: alias as unknown as keyof ApwBaseFields,
    model: model,
    field: model.fields.find(field => field.alias === alias)
});
