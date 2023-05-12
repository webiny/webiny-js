import {
    ApiEndpoint,
    CmsFieldTypePlugins,
    CmsModel,
    CmsModelField,
    CmsModelFieldDefinition,
    CmsModelFieldToGraphQLPlugin
} from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";

interface RenderFieldsParams {
    models: CmsModel[];
    model: CmsModel;
    fields: CmsModelField[];
    type: ApiEndpoint;
    fieldTypePlugins: CmsFieldTypePlugins;
}

interface RenderFields {
    (params: RenderFieldsParams): CmsModelFieldDefinition[];
}

export const renderFields: RenderFields = ({
    models,
    model,
    fields,
    type,
    fieldTypePlugins
}): CmsModelFieldDefinition[] => {
    return fields
        .map(field => renderField({ models, model, type, field, fieldTypePlugins }))
        .filter(Boolean) as CmsModelFieldDefinition[];
};

interface RenderFieldParams extends Omit<RenderFieldsParams, "fields"> {
    field: CmsModelField;
}

export const renderField = ({
    models,
    model,
    type,
    field,
    fieldTypePlugins
}: RenderFieldParams): CmsModelFieldDefinition | null => {
    const plugin = fieldTypePlugins[getBaseFieldType(field)];
    if (!plugin) {
        // Let's not render the field if it does not exist in the field plugins.
        return null;
    }
    const { createTypeField } = plugin[type] as CmsModelFieldToGraphQLPlugin["manage"];
    const defs = createTypeField({
        models,
        model,
        field,
        fieldTypePlugins
    });

    if (!defs) {
        return null;
    } else if (typeof defs === "string") {
        return {
            fields: defs
        };
    }

    return defs;
};
