import { CmsModelFieldToGraphQL } from "../abstractions/CmsModelFieldToGraphQL.js";
import type {
    ApiEndpoint,
    CmsDynamicZoneTemplate,
    CmsModel,
    CmsModelDynamicZoneField,
    CmsModelField,
    CmsModelFieldType,
    CmsModelFieldDefinition
} from "~/types/index.js";
import type { ValidateChildFieldsParams } from "../abstractions/CmsModelFieldToGraphQL.js";
import type { CmsModelFieldAstNode, ICmsModelFieldToAst } from "~/types/modelAst.js";
import type { GraphQLFieldResolver } from "@webiny/handler-graphql/types.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { createTypeName } from "~/utils/createTypeName.js";
import { createGraphQLInputField } from "./utils/createGraphQLInputField.js";
import { createTypeDefsForTemplates } from "./dynamicZone/createTypeDefsForTemplates.js";
import { normalizeDynamicZoneInput } from "./dynamicZone/normalizeDynamicZoneInput.js";

const createUnionTypeName = (model: CmsModel, field: CmsModelField) => {
    return `${model.singularApiName}_${createTypeName(field.fieldId)}`;
};

const getFieldTemplates = (field: CmsModelDynamicZoneField): CmsDynamicZoneTemplate[] => {
    if (!Array.isArray(field.settings?.templates)) {
        return [];
    }
    return field.settings.templates;
};

const remapTemplateValue = (value: any, typeName: string) => {
    return { ...value, __typename: typeName };
};

const createDynamicZoneResolver = (
    endpointType: ApiEndpoint
): ((params: CmsModelFieldToGraphQL.ResolverParams) => CmsModelFieldToGraphQL.Resolver) => {
    return ({ model, models, field, fieldRegistry, createFieldResolvers, graphQLType }) => {
        const dzField = field as CmsModelDynamicZoneField;
        const templates = getFieldTemplates(dzField);

        if (!templates.length) {
            return false;
        }

        const resolver = (parent: any) => {
            const value = parent[field.fieldId];
            if (!value) {
                return value;
            }

            const typeName = `${graphQLType}_${createTypeName(field.fieldId)}`;

            if (field.list && Array.isArray(value)) {
                return value.map(v => {
                    const template = templates.find(tpl => tpl.id === v._templateId);
                    if (!template) {
                        return undefined;
                    }
                    return remapTemplateValue(v, `${typeName}_${template.gqlTypeName}`);
                });
            }

            const template = templates.find(tpl => tpl.id === value._templateId);
            if (!template) {
                return undefined;
            }
            return remapTemplateValue(value, `${typeName}_${template.gqlTypeName}`);
        };

        const { templateTypes } = createTypeDefsForTemplates({
            models,
            field,
            type: endpointType,
            typeOfType: "type",
            model,
            fieldRegistry,
            templates
        });

        const replace = new RegExp(`${model.singularApiName}_`, "g");

        const typeResolvers = templateTypes
            .map(templateType => {
                return templateType.replace(replace, `${graphQLType}_`);
            })
            .reduce<Record<string, Record<string, GraphQLFieldResolver>>>(
                (typeResolvers, templateType, index) => {
                    return {
                        ...typeResolvers,
                        ...createFieldResolvers({
                            graphQLType: templateType,
                            fields: dzField.settings.templates[index].fields
                        })
                    };
                },
                {}
            );

        return {
            resolver,
            typeResolvers
        };
    };
};

class ReadApi implements CmsModelFieldToGraphQL.ReadApi {
    public createTypeField({
        models,
        model,
        field,
        fieldRegistry
    }: CmsModelFieldToGraphQL.TypeFieldParams): CmsModelFieldDefinition | null {
        const dzField = field as CmsModelDynamicZoneField;
        const templates = getFieldTemplates(dzField);
        if (!templates.length) {
            return null;
        }

        const unionTypeName = createUnionTypeName(model, field);

        const { typeDefs, templateTypes } = createTypeDefsForTemplates({
            models,
            field,
            type: "read",
            typeOfType: "type",
            model,
            fieldRegistry,
            templates
        });

        typeDefs.unshift(`union ${unionTypeName} = ${templateTypes.join(" | ")}`);

        return {
            fields: `${field.fieldId}: ${field.list ? `[${unionTypeName}!]` : unionTypeName}`,
            typeDefs: typeDefs.join("\n")
        };
    }

    public createResolver(
        params: CmsModelFieldToGraphQL.ResolverParams
    ): CmsModelFieldToGraphQL.Resolver {
        return createDynamicZoneResolver("read")(params);
    }
}

class ManageApi implements CmsModelFieldToGraphQL.ManageApi {
    public createTypeField({
        models,
        model,
        field,
        fieldRegistry
    }: CmsModelFieldToGraphQL.TypeFieldParams): CmsModelFieldDefinition | null {
        const dzField = field as CmsModelDynamicZoneField;
        const templates = getFieldTemplates(dzField);

        if (!templates.length) {
            return null;
        }

        const unionTypeName = createUnionTypeName(model, field);

        const { typeDefs, templateTypes } = createTypeDefsForTemplates({
            models,
            field,
            type: "manage",
            typeOfType: "type",
            model,
            fieldRegistry,
            templates
        });

        /* Add _templateId. */
        const templateIds = templateTypes.map(type => {
            return `extend type ${type} {
                _templateId: ID!
            }
            `;
        });

        typeDefs.unshift(`union ${unionTypeName} = ${templateTypes.join(" | ")}`);

        return {
            fields: `${field.fieldId}: ${field.list ? `[${unionTypeName}!]` : unionTypeName}`,
            typeDefs: typeDefs.concat(templateIds).join("\n")
        };
    }

    public createInputField({
        models,
        model,
        field,
        fieldRegistry
    }: CmsModelFieldToGraphQL.TypeFieldParams): CmsModelFieldDefinition | null {
        const dzField = field as CmsModelDynamicZoneField;
        const templates = getFieldTemplates(dzField);

        if (!templates.length) {
            return null;
        }

        const { typeDefs, templateTypes } = createTypeDefsForTemplates({
            models,
            field,
            type: "manage",
            typeOfType: "input",
            model,
            fieldRegistry,
            templates
        });

        const typeName = `${model.singularApiName}_${createTypeName(field.fieldId)}`;

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

    public createResolver(
        params: CmsModelFieldToGraphQL.ResolverParams
    ): CmsModelFieldToGraphQL.Resolver {
        return createDynamicZoneResolver("manage")(params);
    }

    public async normalizeInput<T>({
        field,
        input
    }: CmsModelFieldToGraphQL.InputNormalizeParams): Promise<T> {
        const dzField = field as CmsModelDynamicZoneField;
        const templates = dzField.settings?.templates || [];

        if (Array.isArray(input) && field.list) {
            return input
                .map(value => normalizeDynamicZoneInput(value, templates))
                .filter(Boolean) as T;
        }

        return normalizeDynamicZoneInput(input as GenericRecord<string>, templates) as T;
    }
}

class DynamicZoneToGraphQL implements CmsModelFieldToGraphQL.Interface {
    public readonly read = new ReadApi();
    public readonly manage = new ManageApi();

    public readonly fieldType: CmsModelFieldType = "dynamicZone";
    public readonly isSearchable: boolean = false;
    public readonly isSortable: boolean = false;
    public readonly isFullTextSearchable: boolean = false;

    public getReadApi(): CmsModelFieldToGraphQL.ReadApi {
        return this.read;
    }

    public getManageApi(): CmsModelFieldToGraphQL.ManageApi {
        return this.manage;
    }

    public validateChildFields(params: ValidateChildFieldsParams<CmsModelField>): void {
        const field = params.field as CmsModelDynamicZoneField;
        const originalField = params.originalField as CmsModelDynamicZoneField | undefined;

        const getOriginalTemplateFields = (templateId: string) => {
            if (!originalField?.settings?.templates) {
                return [];
            }
            const template = originalField.settings.templates.find(t => t.id === templateId);
            return template?.fields || [];
        };

        for (const template of field.settings.templates) {
            params.validate({
                fields: template.fields,
                originalFields: getOriginalTemplateFields(template.id)
            });
        }
    }

    public getFieldAst(field: CmsModelField, converter: ICmsModelFieldToAst): CmsModelFieldAstNode {
        const dzField = field as CmsModelDynamicZoneField;
        const { templates = [] } = dzField.settings;

        return {
            type: "field",
            field,
            children: templates.map(({ fields, ...template }) => {
                return {
                    type: "collection" as const,
                    collection: {
                        ...template,
                        discriminator: "_templateId"
                    },
                    children: fields.map(f => converter.toAst(f))
                };
            })
        };
    }
}

export const DynamicZoneFieldToGraphQL = CmsModelFieldToGraphQL.createImplementation({
    implementation: DynamicZoneToGraphQL,
    dependencies: []
});
