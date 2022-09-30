/**
 * We are leaving this file because isDeleted might come back later
 */
// @ts-nocheck
import { ApiEndpoint, CmsModel, CmsModelField } from "~/types";

/**
 * Filters deleted fields from the list of fields.
 *
 * Used to recursively delete fields - object field.
 */
interface FilterModelFieldsCallableParams {
    fields: CmsModelField[];
}
interface FilterModelFieldsCallable {
    (params: FilterModelFieldsCallableParams): CmsModelField[];
}

const filterDeletedFields: FilterModelFieldsCallable = params => {
    return params.fields.reduce<CmsModelField[]>((output, field) => {
        if (!!field.isDeleted) {
            return output;
        } else if (field.settings?.fields) {
            const fields = filterDeletedFields({
                fields: field.settings.fields
            });

            output.push({
                ...field,
                settings: {
                    ...field.settings,
                    fields
                }
            });
            return output;
        }

        output.push(field);

        return output;
    }, []);
};

/**
 * Filters deleted fields from given model.
 */
interface FilterModelDeletedFieldsCallableParams {
    model: CmsModel;
}
interface FilterModelDeletedFieldsCallable {
    (params: FilterModelDeletedFieldsCallableParams): CmsModel;
}
const filterModelDeletedFields: FilterModelDeletedFieldsCallable = ({ model }) => {
    const fields = filterDeletedFields(model);
    return {
        ...model,
        fields
    };
};

/**
 * Filters deleted fields from all given models.
 */
interface FilterModelsDeletedFieldsCallableParams {
    models: CmsModel[];
    type: ApiEndpoint;
}
interface FilterModelsDeletedFieldsCallable {
    (params: FilterModelsDeletedFieldsCallableParams): CmsModel[];
}
export const filterModelsDeletedFields: FilterModelsDeletedFieldsCallable = ({ models, type }) => {
    if (type === "manage") {
        return models;
    }
    return models.map(model => {
        return filterModelDeletedFields({
            model
        });
    });
};
