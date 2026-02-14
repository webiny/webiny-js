import { ErrorResponse, NotFoundError, Response } from "@webiny/handler-graphql";
import type { CmsContext, CmsModel } from "~/types/index.js";
import type { Resolvers } from "@webiny/handler-graphql/types.js";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { createCmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface CreateModelsSchemaParams {
    context: CmsContext;
}

export const createModelsSchema = ({
    context
}: CreateModelsSchemaParams): ICmsGraphQLSchemaPlugin => {
    const resolvers: Resolvers<CmsContext> = {
        Query: {
            getContentModel: async (_: unknown, args: GenericRecord, context) => {
                try {
                    const model = await context.cms.getModel(args.modelId);

                    if (!model) {
                        throw new NotFoundError(`Content model "${args.modelId}" was not found!`);
                    }

                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listContentModels: async (_: unknown, args: GenericRecord, context: CmsContext) => {
                try {
                    const models = await context.cms.listModels({
                        includePrivate: false,
                        includePlugins: args?.includePlugins === false ? false : true
                    });
                    return new Response(models);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        CmsContentModelField: {
            renderer: field => {
                // Make sure `settings` is an object.
                if (field.renderer) {
                    // We're using `||` here, because we want to use the fallback value for both `undefined` and `null`.
                    return { ...field.renderer, settings: field.renderer.settings || {} };
                }

                return field.renderer;
            },
            tags(field) {
                // Make sure `tags` are always returned as an array.
                return Array.isArray(field.tags) ? field.tags : [];
            }
        },
        CmsContentModel: {
            tags(model: CmsModel) {
                // Make sure `tags` always contain a `type` tag, to differentiate between models.
                const hasType = (model.tags || []).find(tag => tag.startsWith("type:"));

                return hasType ? model.tags : ["type:model", ...(model.tags || [])];
            },
            plugin: (model: CmsModel) => {
                return model.isPlugin ?? false;
            }
        }
    };

    let manageSchema = "";
    if (context.cms.MANAGE) {
        resolvers["Mutation"] = {
            createContentModel: async (_: unknown, args: any, context) => {
                try {
                    const model = await context.cms.createModel(args.data);
                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            createContentModelFrom: async (_: unknown, args: any, context) => {
                try {
                    const model = await context.cms.createModelFrom(args.modelId, args.data);
                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateContentModel: async (_: unknown, args: any, context) => {
                const { modelId, data } = args;
                try {
                    const model = await context.cms.updateModel(modelId, data);
                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteContentModel: async (_: unknown, args: any, context) => {
                const { modelId } = args;
                try {
                    await context.cms.deleteModel(modelId);
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        };

        manageSchema = /* GraphQL */ `
            input CmsPredefinedValueInput {
                label: String!
                value: String!
                selected: Boolean
            }

            input CmsPredefinedValuesInput {
                enabled: Boolean
                values: [CmsPredefinedValueInput]
            }
            input CmsFieldRendererInput {
                name: String
                settings: JSON
            }

            input CmsFieldValidationInput {
                name: String!
                message: String
                settings: JSON
            }

            input CmsContentModelFieldInput {
                id: ID!
                label: String!
                help: String
                description: String
                note: String
                placeholder: String
                # we never use user input - this is here to the GraphQL does not break when posting from our UI
                # used for debugging purposes
                storageId: String
                fieldId: String!
                type: String!
                tags: [String!]
                multipleValues: Boolean
                predefinedValues: CmsPredefinedValuesInput
                renderer: CmsFieldRendererInput
                validation: [CmsFieldValidationInput]
                listValidation: [CmsFieldValidationInput]
                settings: JSON
            }

            input CmsContentModelCreateInput {
                name: String!
                singularApiName: String!
                pluralApiName: String!
                modelId: String
                group: String!
                icon: Icon
                singleEntry: Boolean
                description: String
                layout: [[ID!]!]
                fields: [CmsContentModelFieldInput!]
                titleFieldId: String
                descriptionFieldId: String
                imageFieldId: String
                tags: [String!]
                defaultFields: Boolean
            }

            input CmsContentModelCreateFromInput {
                name: String!
                singularApiName: String!
                pluralApiName: String!
                modelId: String
                group: String!
                icon: Icon
                description: String
            }

            input CmsContentModelUpdateInput {
                name: String
                singularApiName: String
                pluralApiName: String
                group: String
                icon: Icon
                description: String
                layout: [[ID!]!]!
                fields: [CmsContentModelFieldInput!]!
                titleFieldId: String
                descriptionFieldId: String
                imageFieldId: String
                tags: [String!]
            }

            extend type Mutation {
                createContentModel(data: CmsContentModelCreateInput!): CmsContentModelResponse

                createContentModelFrom(
                    modelId: ID!
                    data: CmsContentModelCreateFromInput!
                ): CmsContentModelResponse

                updateContentModel(
                    modelId: ID!
                    data: CmsContentModelUpdateInput!
                ): CmsContentModelResponse

                deleteContentModel(modelId: ID!): CmsDeleteResponse
            }
        `;
    }

    const plugin = createCmsGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type CmsFieldValidation {
                name: String!
                message: String
                settings: JSON
            }

            type CmsFieldRenderer {
                name: String
                settings: JSON
            }

            type CmsPredefinedValue {
                label: String
                value: String
                selected: Boolean
            }

            type CmsPredefinedValues {
                enabled: Boolean
                values: [CmsPredefinedValue]
            }

            type CmsContentModelField {
                id: ID!
                # auto-generated value
                # used for debugging purposes
                storageId: String
                fieldId: String!
                label: String!
                help: String
                description: String
                note: String
                placeholder: String
                type: String!
                tags: [String!]!
                multipleValues: Boolean
                predefinedValues: CmsPredefinedValues
                renderer: CmsFieldRenderer
                validation: [CmsFieldValidation!]
                listValidation: [CmsFieldValidation!]
                settings: JSON
            }

            type CmsContentModel {
                name: String!
                singularApiName: String!
                pluralApiName: String!
                modelId: String!
                description: String
                group: String!
                icon: Icon
                createdOn: DateTime
                savedOn: DateTime
                createdBy: CmsIdentity
                fields: [CmsContentModelField!]!
                layout: [[String!]!]!
                titleFieldId: String
                descriptionFieldId: String
                imageFieldId: String
                tags: [String!]!
                tenant: String!
                # Returns true if the content model is registered via a plugin.
                plugin: Boolean!
            }

            type CmsContentModelResponse {
                data: CmsContentModel
                error: CmsError
            }

            type CmsContentModelListResponse {
                data: [CmsContentModel]
                meta: CmsListMeta
                error: CmsError
            }

            extend type Query {
                getContentModel(modelId: ID!, where: JSON, sort: String): CmsContentModelResponse

                listContentModels(includePlugins: Boolean = true): CmsContentModelListResponse
            }

            ${manageSchema}
        `,
        resolvers
    });
    plugin.name = `headless-cms.graphql.schema.${context.cms.type}.content-models`;
    return plugin;
};
