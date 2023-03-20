import {
    CmsFieldTypePlugins,
    CmsModel,
    CmsModelField,
    CmsModelFieldDefinition,
    CmsModelFieldToGraphQLPlugin
} from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";

interface RenderInputFieldsParams {
    models: CmsModel[];
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
}
interface RenderInputFieldParams extends RenderInputFieldsParams {
    field: CmsModelField;
}
interface RenderInputFields {
    (params: RenderInputFieldsParams): CmsModelFieldDefinition[];
}

export const renderInputFields: RenderInputFields = ({
    models,
    model,
    fieldTypePlugins
}): CmsModelFieldDefinition[] => {
    return model.fields
        .map(field => renderInputField({ models, model, field, fieldTypePlugins }))
        .filter(Boolean) as CmsModelFieldDefinition[];
};

export const renderInputField = ({
    models,
    model,
    field,
    fieldTypePlugins
}: RenderInputFieldParams): CmsModelFieldDefinition | null => {
    // Every time a client updates content model's fields, we check the type of each field. If a field plugin
    // for a particular "field.type" doesn't exist on the backend yet, we throw an error. But still, we also
    // want to be careful when accessing the field plugin here too. It is still possible to have a content model
    // that contains a field, for which we don't have a plugin registered on the backend. For example, user
    // could've just removed the plugin from the backend.
    const plugin: CmsModelFieldToGraphQLPlugin = fieldTypePlugins[getBaseFieldType(field)];

    if (!plugin) {
        // Let's not render the field if it does not exist in the field plugins.
        return null;
    }

    const def = plugin.manage.createInputField({
        models,
        model,
        field,
        fieldTypePlugins
    });
    if (typeof def === "string") {
        return {
            fields: def
        };
    }

    return def;
};
