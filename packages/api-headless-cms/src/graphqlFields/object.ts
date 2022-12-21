import upperFirst from "lodash/upperFirst";
import { CmsModelFieldToGraphQLPlugin } from "~/types";
import { attachRequiredFieldValue } from "./helpers";
import { createTypeFromFields } from "~/utils/createTypeFromFields";

export const createObjectField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-object",
        type: "cms-model-field-to-graphql",
        fieldType: "object",
        isSortable: false,
        isSearchable: false,
        read: {
            createTypeField({ field, model, fieldTypePlugins }) {
                const result = createTypeFromFields({
                    typeOfType: "type",
                    model,
                    type: "read",
                    fieldId: field.fieldId,
                    fields: field.settings?.fields || [],
                    fieldTypePlugins
                });

                if (!result) {
                    return null;
                }
                const { fieldType, typeDefs } = result;

                return {
                    fields: `${field.fieldId}: ${
                        field.multipleValues ? `[${fieldType}!]` : fieldType
                    }`,
                    typeDefs
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
            }
        },
        manage: {
            createTypeField({ model, field, fieldTypePlugins }) {
                const result = createTypeFromFields({
                    typeOfType: "type",
                    model,
                    type: "manage",
                    fieldId: field.fieldId,
                    fields: field.settings?.fields || [],
                    fieldTypePlugins
                });

                if (!result) {
                    return null;
                }
                const { fieldType, typeDefs } = result;

                return {
                    fields: `${field.fieldId}: ${
                        field.multipleValues ? `[${fieldType}!]` : fieldType
                    }`,
                    typeDefs
                };
            },
            createInputField({ model, field, fieldTypePlugins }) {
                const result = createTypeFromFields({
                    typeOfType: "input",
                    model,
                    type: "manage",
                    fieldId: field.fieldId,
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
            }
        }
    };
};
