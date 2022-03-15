import {
    ApiEndpoint,
    CmsFieldTypePlugins,
    CmsModel,
    CmsModelField,
    CmsModelFieldDefinition,
    CmsModelFieldToGraphQLPlugin
} from "~/types";

interface RenderFieldsParams {
    model: CmsModel;
    type: ApiEndpoint;
    fieldTypePlugins: CmsFieldTypePlugins;
}
interface RenderFields {
    (params: RenderFieldsParams): CmsModelFieldDefinition[];
}

export const renderFields: RenderFields = ({
    model,
    type,
    fieldTypePlugins
}): CmsModelFieldDefinition[] => {
    return model.fields
        .map(field => renderField({ model, type, field, fieldTypePlugins }))
        .filter(Boolean) as CmsModelFieldDefinition[];
};

interface RenderFieldParams extends RenderFieldsParams {
    field: CmsModelField;
}

export const renderField = ({
    model,
    type,
    field,
    fieldTypePlugins
}: RenderFieldParams): CmsModelFieldDefinition | null => {
    const plugin: CmsModelFieldToGraphQLPlugin = fieldTypePlugins[field.type];
    if (!plugin) {
        // Let's not render the field if it does not exist in the field plugins.
        return null;
    }
    const defs = plugin[type].createTypeField({
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
