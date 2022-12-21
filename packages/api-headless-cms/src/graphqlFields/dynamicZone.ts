import {
    CmsEntry,
    CmsContext,
    CmsModelFieldToGraphQLPlugin,
    CmsModel,
    CmsModelField,
    CmsModelDynamicZoneField,
    CmsDynamicZoneTemplate,
    ApiEndpoint,
    CmsFieldTypePlugins
} from "~/types";
import { createReadTypeName, createTypeName } from "~/utils/createTypeName";
import { createTypeFromFields } from "~/utils/createTypeFromFields";
import { createGraphQLInputField } from "./helpers";

const createUnionTypeName = (model: CmsModel, field: CmsModelField) => {
    return `${createReadTypeName(model.modelId)}_${createReadTypeName(field.fieldId)}`;
};

const getFieldTemplates = (field: CmsModelField): CmsDynamicZoneTemplate[] => {
    if (!field.settings || !Array.isArray(field.settings.templates)) {
        return [];
    }
    return field.settings.templates;
};

const appendTypename = (entries: CmsEntry[], typename: string): CmsEntry[] => {
    return entries.map(item => {
        return {
            ...item,
            __typename: typename
        };
    });
};

interface CreateTypeDefsForTemplatesParams {
    model: CmsModel;
    field: CmsModelField;
    type: ApiEndpoint;
    typeOfType: "type" | "input";
    templates: CmsDynamicZoneTemplate[];
    fieldTypePlugins: CmsFieldTypePlugins;
}

const createTypeDefsForTemplates = ({
    model,
    field,
    type,
    templates,
    typeOfType,
    fieldTypePlugins
}: CreateTypeDefsForTemplatesParams) => {
    const typeDefs: string[] = [];
    const templateTypes: string[] = [];

    templates.forEach(template => {
        const typeName = [createTypeName(field.fieldId), createTypeName(template.name)].join("_");

        const result = createTypeFromFields({
            typeOfType,
            model,
            type,
            typeName,
            fields: template.fields,
            fieldTypePlugins
        });

        if (!result) {
            return;
        }

        typeDefs.push(result.typeDefs);
        templateTypes.push(result.fieldType);
    });

    return { typeDefs, templateTypes };
};

export const createDynamicZoneField =
    (): CmsModelFieldToGraphQLPlugin<CmsModelDynamicZoneField> => {
        return {
            name: "cms-model-field-to-graphql-dynamic-zone",
            type: "cms-model-field-to-graphql",
            fieldType: "dynamicZone",
            isSortable: false,
            isSearchable: false,
            read: {
                createTypeField({ model, field, fieldTypePlugins }) {
                    const templates = getFieldTemplates(field);
                    const unionTypeName = createUnionTypeName(model, field);

                    const { typeDefs, templateTypes } = createTypeDefsForTemplates({
                        field,
                        type: "read",
                        typeOfType: "type",
                        model,
                        fieldTypePlugins,
                        templates
                    });

                    typeDefs.unshift(`union ${unionTypeName} = ${templateTypes.join(" | ")}`);

                    return {
                        fields: `${field.fieldId}: ${
                            field.multipleValues ? `[${unionTypeName}!]` : unionTypeName
                        }`,
                        typeDefs: typeDefs.join("\n")
                    };
                },
                /**
                 * TS is complaining about mixed types for createResolver.
                 * TODO @ts-refactor @pavel Maybe we should have a single createResolver method?
                 */
                // @ts-ignore
                createResolver(params) {
                    const { field } = params;
                    // Create a map of template types
                    const templates = getFieldTemplates(field);

                    return async (parent, _, context: CmsContext) => {
                        const { cms } = context;

                        if (field.multipleValues) {
                            // TODO: append __typename to each value
                            // return appendTypename(entries, modelIdToTypeName.get(modelId));
                        }

                        return {
                            // ...value
                            __typename: "TODO"
                        };
                    };
                }
            },
            manage: {
                createTypeField({ model, field, fieldTypePlugins }) {
                    const templates = getFieldTemplates(field);
                    const unionTypeName = createUnionTypeName(model, field);

                    const { typeDefs, templateTypes } = createTypeDefsForTemplates({
                        field,
                        type: "manage",
                        typeOfType: "type",
                        model,
                        fieldTypePlugins,
                        templates
                    });

                    typeDefs.unshift(`union ${unionTypeName} = ${templateTypes.join(" | ")}`);

                    return {
                        fields: `${field.fieldId}: ${
                            field.multipleValues ? `[${unionTypeName}!]` : unionTypeName
                        }`,
                        typeDefs: typeDefs.join("\n")
                    };
                },
                createInputField({ model, field, fieldTypePlugins }) {
                    const templates = getFieldTemplates(field);

                    const { typeDefs, templateTypes } = createTypeDefsForTemplates({
                        field,
                        type: "manage",
                        typeOfType: "input",
                        model,
                        fieldTypePlugins,
                        templates
                    });

                    const typeName = [
                        createTypeName(model.modelId),
                        createTypeName(field.fieldId)
                    ].join("_");

                    const inputProperties = templateTypes.map(inputTypeName => {
                        const key = inputTypeName.replace(`${typeName}_`, "").replace("Input", "");
                        return [key, inputTypeName];
                    });

                    /**
                     * Generate a field input type, similar to this example:
                     *
                     * input Article_ContentInput {
                     *     Hero: Article_Content_HeroInput
                     *     SimpleText: Article_Content_SimpleTextInput
                     * }
                     */
                    typeDefs.push(`input ${typeName}Input {
                        ${inputProperties.map(
                            ([key, value]) => `
                            ${key}: ${value}
                        `
                        )} 
                    }`);

                    return {
                        fields: createGraphQLInputField(field, `${typeName}Input`),
                        typeDefs: typeDefs.join("\n")
                    };
                }
            }
        };
    };
