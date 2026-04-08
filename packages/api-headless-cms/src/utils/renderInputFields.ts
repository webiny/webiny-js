import type { CmsModel, CmsModelField, CmsModelFieldDefinition } from "~/types/index.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import type { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

interface RenderInputFieldsParams {
    models: CmsModel[];
    model: CmsModel;
    fields: CmsModelField[];
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
}

interface RenderInputFieldParams extends Omit<RenderInputFieldsParams, "fields"> {
    field: CmsModelField;
}

interface RenderInputFields {
    (params: RenderInputFieldsParams): CmsModelFieldDefinition[];
}

export const renderInputFields: RenderInputFields = ({
    models,
    model,
    fields,
    fieldRegistry
}): CmsModelFieldDefinition[] => {
    return fields.reduce<CmsModelFieldDefinition[]>((result, field) => {
        const input = renderInputField({ models, model, field, fieldRegistry });
        if (!input) {
            return result;
        }
        result.push(input);
        return result;
    }, []);
};

export const renderInputField = ({
    models,
    model,
    field,
    fieldRegistry
}: RenderInputFieldParams): CmsModelFieldDefinition | null => {
    const plugin = fieldRegistry.get(getBaseFieldType(field));

    if (!plugin) {
        return null;
    }

    const def = plugin.manage.createInputField({
        models,
        model,
        field,
        fieldRegistry
    });
    if (typeof def === "string") {
        return {
            fields: def
        };
    }

    return def;
};
