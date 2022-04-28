import upperFirst from "lodash/upperFirst";
import {
    ApiEndpoint,
    CmsFieldTypePlugins,
    CmsModel,
    CmsModelField,
    CmsModelFieldToGraphQLPlugin
} from "~/types";
import { renderField } from "~/content/plugins/utils/renderFields";
import { renderInputField } from "~/content/plugins/utils/renderInputFields";
import { createManageTypeName, createTypeName } from "~/content/plugins/utils/createTypeName";
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
    const fields: CmsModelField[] = (field.settings?.fields || []).filter(f => {
        return !!f.alias;
    });

    const fieldTypeName = `${mTypeName}_${upperFirst(field.alias as string)}`;

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

const plugin: CmsModelFieldToGraphQLPlugin = {
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
                fields: `${field.alias}: ${field.multipleValues ? `[${fieldType}!]` : fieldType}`,
                typeDefs
            };
        },
        createResolver({ field, createFieldResolvers, graphQLType }) {
            const fields = (field.settings?.fields || []).filter(f => {
                return !!f.alias;
            });
            if (fields.length === 0) {
                return false;
            }

            const fieldType = `${graphQLType}_${upperFirst(field.alias as string)}`;

            const typeResolvers = createFieldResolvers({
                graphQLType: fieldType,
                fields
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
                fields: `${field.alias}: ${field.multipleValues ? `[${fieldType}!]` : fieldType}`,
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
                    `${field.alias}: ${field.multipleValues ? `[${fieldType}!]` : fieldType}`,
                    field
                ),
                typeDefs
            };
        },
        createResolver({ graphQLType, field, createFieldResolvers }) {
            const fields = (field.settings?.fields || []).filter(f => {
                return !!f.alias;
            });
            if (fields.length === 0) {
                return false;
            }
            const fieldType = `${graphQLType}_${upperFirst(field.alias as string)}`;
            const typeResolvers = createFieldResolvers({
                graphQLType: fieldType,
                fields
            });
            return {
                resolver: null,
                typeResolvers: typeResolvers || {}
            };
        }
    }
};

export default plugin;
