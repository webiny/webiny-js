import type {
    ApiEndpoint,
    CmsModel,
    CmsModelField,
    CmsModelFieldDefinition
} from "~/types/index.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";
import type {
    CmsModelFieldToGraphQL,
    CmsModelFieldToGraphQLRegistry
} from "~/features/graphql/index.js";

const getFieldApi = (
    field: CmsModelFieldToGraphQL.Interface,
    type: ApiEndpoint
): CmsModelFieldToGraphQL.ManageApi => {
    if (type === "manage") {
        return field.manage;
    }
    /* "read" and "preview" both use the read API. */
    return field.read as CmsModelFieldToGraphQL.ManageApi;
};

interface RenderFieldsParams {
    models: CmsModel[];
    model: CmsModel;
    fields: CmsModelField[];
    type: ApiEndpoint;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
}

interface RenderFields {
    (params: RenderFieldsParams): CmsModelFieldDefinition[];
}

export const renderFields: RenderFields = ({
    models,
    model,
    fields,
    type,
    fieldRegistry
}): CmsModelFieldDefinition[] => {
    return fields
        .map(field => renderField({ models, model, type, field, fieldRegistry }))
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
    fieldRegistry
}: RenderFieldParams): CmsModelFieldDefinition | null => {
    const plugin = fieldRegistry.get(getBaseFieldType(field));
    if (!plugin) {
        return null;
    }
    const api = getFieldApi(plugin, type);
    const { createTypeField } = api;
    const defs = createTypeField({
        models,
        model,
        field,
        fieldRegistry
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
