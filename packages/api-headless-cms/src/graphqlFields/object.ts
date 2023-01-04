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
import {
    createManageTypeName,
    createTypeName as createModelTypeName
} from "~/utils/createTypeName";
import { attachRequiredFieldValue } from "./helpers";
import lodashUpperFirst from "lodash/upperFirst";

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
    const { typeOfType, model, type, field: parentField, fieldTypePlugins } = params;
    const typeSuffix = typeOfType === "input" ? "Input" : "";
    const typeName = createModelTypeName(model.modelId);
    const mTypeName = createManageTypeName(typeName);

    // `field` is an "object" field
    const fields: CmsModelField[] = parentField.settings?.fields || [];

    const fieldTypeName = `${mTypeName}_${upperFirst(parentField.fieldId)}`;

    const typeFields = [];
    const nestedTypes = [];

    // Once the loop below starts, we'll be executing a recursive "object" type generation.
    // The main trick here is that nested objects don't know who the parent is, and will generate
    // type names using the "model", as if they're at the top level:
    // Every time the types are returned, we need to replace the model name in the generated type name
    // with the actual prefix which includes parent field name type.
    const replace = new RegExp(`${mTypeName}_`, "g");

    for (const field of fields) {
        const result =
            typeOfType === "type"
                ? renderField({
                      field,
                      type,
                      model,
                      fieldTypePlugins
                  })
                : renderInputField({
                      field,
                      model,
                      fieldTypePlugins
                  });

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
        ${filters}
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
            },
            createListFilters
        }
    };
};
