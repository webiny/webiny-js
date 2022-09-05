import upperFirst from "lodash/upperFirst";
import {
    ApiEndpoint,
    CmsFieldTypePlugins,
    CmsModel,
    CmsModelField,
    CmsModelFieldToGraphQLPlugin
} from "~/types";
import { renderField } from "~/utils/renderFields";
import { renderInputField } from "~/utils/renderInputFields";
import { createManageTypeName, createTypeName } from "~/utils/createTypeName";
import { attachRequiredFieldValue } from "./helpers";

interface TypeFromFieldParams {
    typeOfType: string;
    model: CmsModel;
    type: ApiEndpoint;
    field: CmsModelField;
    fieldTypePlugins: CmsFieldTypePlugins;
}
interface TypeFromFieldResponse {
    fieldType: string;
    typeDefs: string;
}
const typeFromField = (params: TypeFromFieldParams): TypeFromFieldResponse | null => {
    const { typeOfType, model, type, field, fieldTypePlugins } = params;
    const typeSuffix = typeOfType === "input" ? "Input" : "";
    const typeName = createTypeName(model.modelId);
    const mTypeName = createManageTypeName(typeName);

    // `field` is an "object" field
    const fields: CmsModelField[] = field.settings?.fields || [];

    const fieldTypeName = `${mTypeName}_${upperFirst(field.fieldId)}`;

    const typeFields = [];
    const nestedTypes = [];

    // Once the loop below starts, we'll be executing a recursive "object" type generation.
    // The main trick here is that nested objects don't know who the parent is, and will generate
    // type names using the "model", as if they're at the top level:
    // Every time the types are returned, we need to replace the model name in the generated type name
    // with the actual prefix which includes parent field name type.
    const replace = new RegExp(`${mTypeName}_`, "g");

    for (const f of fields) {
        const result =
            typeOfType === "type"
                ? renderField({ field: f, type, model, fieldTypePlugins })
                : renderInputField({ field: f, model, fieldTypePlugins });

        if (!result) {
            continue;
        }

        const { fields, typeDefs } = result;

        typeFields.push(fields.replace(replace, `${fieldTypeName}_`));
        if (typeDefs) {
            nestedTypes.push(typeDefs.replace(replace, `${fieldTypeName}_`));
        }
    }

    return {
        fieldType: `${fieldTypeName}${typeSuffix}`,
        typeDefs: /* GraphQL */ `
            ${nestedTypes.join("\n")}
                    
            ${typeOfType} ${fieldTypeName}${typeSuffix} {
                ${typeFields.join("\n")}
            }
        `
    };
};

export const createObjectField = (): CmsModelFieldToGraphQLPlugin => {
    return {
        name: "cms-model-field-to-graphql-object",
        type: "cms-model-field-to-graphql",
        fieldType: "object",
        isSortable: false,
        isSearchable: false,
        read: {
            createTypeField({ field, model, fieldTypePlugins }) {
                const result = typeFromField({
                    typeOfType: "type",
                    model,
                    type: "read",
                    field,
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
                const result = typeFromField({
                    typeOfType: "type",
                    model,
                    type: "manage",
                    field,
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
                const result = typeFromField({
                    typeOfType: "input",
                    model,
                    type: "manage",
                    field,
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
