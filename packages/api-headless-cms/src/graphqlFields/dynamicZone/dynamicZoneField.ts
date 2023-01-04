import {
    CmsModelFieldToGraphQLPlugin,
    CmsModel,
    CmsModelField,
    CmsModelDynamicZoneField,
    CmsDynamicZoneTemplate,
    ApiEndpoint,
    CmsFieldTypePlugins,
    CmsModelFieldToGraphQLCreateResolver
} from "~/types";
import { createReadTypeName, createTypeName } from "~/utils/createTypeName";
import { createTypeFromFields } from "~/utils/createTypeFromFields";
import { createGraphQLInputField } from "../helpers";

const createUnionTypeName = (model: CmsModel, field: CmsModelField) => {
    return `${createReadTypeName(model.modelId)}_${createReadTypeName(field.fieldId)}`;
};

const getFieldTemplates = (field: CmsModelDynamicZoneField): CmsDynamicZoneTemplate[] => {
    if (!Array.isArray(field.settings?.templates)) {
        return [];
    }
    return field.settings.templates;
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
        const typeName = [createTypeName(field.fieldId), template.gqlTypeName].join("_");

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

const remapTemplateValue = (value: any, typeName: string) => {
    const templateType = Object.keys(value)[0];

    return { ...value[templateType], __typename: `${typeName}_${templateType}` };
};

const createResolver: CmsModelFieldToGraphQLCreateResolver<CmsModelDynamicZoneField> = ({
    model,
    field
}) => {
    return parent => {
        const value = parent[field.fieldId];
        if (!value) {
            return value;
        }

        const typeName = `${createTypeName(model.modelId)}_${createTypeName(field.fieldId)}`;

        if (field.multipleValues && Array.isArray(value)) {
            return value.map(v => remapTemplateValue(v, typeName));
        }

        return remapTemplateValue(value, typeName);
    };
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
                createResolver
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

                    // Add _templateId
                    const templateIds = templateTypes.map(type => {
                        return `extend type ${type} {
                            _templateId: ID!
                        }
                        `;
                    });

                    typeDefs.unshift(`union ${unionTypeName} = ${templateTypes.join(" | ")}`);

                    return {
                        fields: `${field.fieldId}: ${
                            field.multipleValues ? `[${unionTypeName}!]` : unionTypeName
                        }`,
                        typeDefs: typeDefs.concat(templateIds).join("\n")
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

                    const typeName = `${createTypeName(model.modelId)}_${createTypeName(
                        field.fieldId
                    )}`;

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
                },
                createResolver
            }
        };
    };
