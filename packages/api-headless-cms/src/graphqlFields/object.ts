import upperFirst from "lodash/upperFirst";
import {
    CmsFieldTypePlugins,
    CmsModel,
    CmsModelField,
    CmsModelFieldToGraphQLPlugin
} from "~/types";
import { attachRequiredFieldValue } from "./helpers";
import lodashUpperFirst from "lodash/upperFirst";
import { createTypeFromFields } from "~/utils/createTypeFromFields";

interface AttachTypeDefinitionsParams {
    model: CmsModel;
    field: CmsModelField;
    plugins: CmsFieldTypePlugins;
    endpointType: "manage" | "read";
}
const createChildTypeDefs = (params: AttachTypeDefinitionsParams): string => {
    const { field, plugins, model, endpointType } = params;
    const fields = field.settings?.fields || [];

    const typeName = createTypeName({
        model,
        field,
        parents: field.settings?.parents
    });

    const filters = fields
        .map(child => {
            const createListFilters = plugins[child.type][endpointType].createListFilters;
            if (!createListFilters) {
                return null;
            }

            const filters = createListFilters({
                model,
                field: {
                    ...child,
                    settings: {
                        ...child.settings,
                        parents: (child.settings?.parents || []).concat([field.fieldId])
                    }
                },
                plugins
            });
            if (!filters) {
                return null;
            }
            return filters;
        })
        .filter(Boolean)
        .join("\n");
    return `input ${typeName}WhereInput {
        ${filters || "_empty: String"}
    }`;
};

interface CreateTypeNameParams {
    model: CmsModel;
    parents?: string[];
    field: CmsModelField;
}
const createTypeName = (params: CreateTypeNameParams): string => {
    const { model, parents = [], field } = params;
    return [model.modelId]
        .concat(parents)
        .concat([field.fieldId])
        .filter(Boolean)
        .map(id => {
            return lodashUpperFirst(id);
        })
        .join("_");
};

interface CreateListFiltersParams {
    field: CmsModelField;
    model: CmsModel;
}
const createListFilters = ({ field, model }: CreateListFiltersParams) => {
    const typeName = createTypeName({
        model,
        field,
        parents: field.settings?.parents
    });

    return `${field.fieldId}: ${typeName}WhereInput`;
};

export const createObjectField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-object",
        type: "cms-model-field-to-graphql",
        fieldType: "object",
        isSortable: false,
        isSearchable: false,
        validateChildFields: params => {
            const { field, originalField, validate } = params;

            validate({
                fields: field.settings?.fields || [],
                originalFields: originalField?.settings?.fields || []
            });
        },
        read: {
            createTypeField({ field, model, fieldTypePlugins }) {
                const result = createTypeFromFields({
                    typeOfType: "type",
                    model,
                    type: "read",
                    typeNamePrefix: createTypeName({
                        model,
                        field,
                        parents: field.settings?.parents
                    }),
                    fields: field.settings?.fields || [],
                    fieldTypePlugins
                });

                if (!result) {
                    return null;
                }
                const { fieldType, typeDefs } = result;

                const childTypeDefs = createChildTypeDefs({
                    model,
                    field,
                    plugins: fieldTypePlugins,
                    endpointType: "read"
                });

                return {
                    fields: `${field.fieldId}: ${
                        field.multipleValues ? `[${fieldType}!]` : fieldType
                    }`,
                    typeDefs: `${typeDefs}${childTypeDefs}`
                };
            },
            createResolver({ field, createFieldResolvers, graphQLType }) {
                if (!field.settings?.fields || field.settings.fields.length === 0) {
                    return false;
                }

                const fieldType = `${graphQLType}_${upperFirst(field.fieldId)}`;

                const typeResolvers = createFieldResolvers({
                    graphQLType: fieldType,
                    fields: field.settings.fields
                });
                return {
                    resolver: null,
                    typeResolvers: typeResolvers || {}
                };
            },
            createListFilters
        },
        manage: {
            createTypeField({ model, field, fieldTypePlugins }) {
                const result = createTypeFromFields({
                    typeOfType: "type",
                    model,
                    type: "manage",
                    typeNamePrefix: createTypeName({
                        model,
                        field,
                        parents: field.settings?.parents
                    }),
                    fields: field.settings?.fields || [],
                    fieldTypePlugins
                });

                if (!result) {
                    return null;
                }
                const { fieldType, typeDefs } = result;

                const childTypeDefs = createChildTypeDefs({
                    model,
                    field,
                    plugins: fieldTypePlugins,
                    endpointType: "manage"
                });

                return {
                    fields: `${field.fieldId}: ${
                        field.multipleValues ? `[${fieldType}!]` : fieldType
                    }`,
                    typeDefs: `${typeDefs}${childTypeDefs}`
                };
            },
            createInputField({ model, field, fieldTypePlugins }) {
                const result = createTypeFromFields({
                    typeOfType: "input",
                    model,
                    type: "manage",
                    typeNamePrefix: createTypeName({
                        model,
                        field,
                        parents: field.settings?.parents
                    }),
                    fields: field.settings?.fields || [],
                    fieldTypePlugins
                });
                if (!result) {
                    return null;
                }
                const { fieldType, typeDefs } = result;

                return {
                    fields: attachRequiredFieldValue(
                        `${field.fieldId}: ${field.multipleValues ? `[${fieldType}!]` : fieldType}`,
                        field
                    ),
                    typeDefs
                };
            },
            createResolver({ graphQLType, field, createFieldResolvers }) {
                if (!field.settings?.fields || field.settings.fields.length === 0) {
                    return false;
                }
                const fieldType = `${graphQLType}_${upperFirst(field.fieldId)}`;
                const typeResolvers = createFieldResolvers({
                    graphQLType: fieldType,
                    fields: field.settings.fields
                });
                return {
                    resolver: null,
                    typeResolvers: typeResolvers || {}
                };
            },
            createListFilters
        }
    };
};
