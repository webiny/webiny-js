import { ErrorResponse, Response } from "@webiny/handler-graphql";
import {
    CmsModelCreateInput,
    CmsModelUpdateInput,
    CmsContext,
    CmsModelCreateFromInput,
    CmsModelField
} from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { Resolvers } from "@webiny/handler-graphql/types";
import { CmsModelPlugin } from "~/content/plugins/CmsModelPlugin";

interface CreateCmsModelArgs {
    data: CmsModelCreateInput;
}

interface CreateFromCmsModelFromArgs {
    modelId: string;
    data: CmsModelCreateFromInput;
}

interface ReadCmsModelArgs {
    modelId: string;
}

interface UpdateCmsModelArgs extends ReadCmsModelArgs {
    data: CmsModelUpdateInput;
}

interface DeleteCmsModelArgs {
    modelId: string;
}

const plugin = (context: CmsContext): GraphQLSchemaPlugin<CmsContext> => {
    const resolvers: Resolvers<CmsContext> = {
        Query: {
            getContentModel: async (_: unknown, args: ReadCmsModelArgs, context) => {
                try {
                    const model = await context.cms.getModel(args.modelId);
                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listContentModels: async (_: unknown, __: unknown, context: CmsContext) => {
                try {
                    const model = await context.cms.listModels();
                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        CmsContentModel: {
            plugin: async (model, _, context) => {
                const modelPlugin: CmsModelPlugin = context.plugins
                    .byType<CmsModelPlugin>(CmsModelPlugin.type)
                    .find((item: CmsModelPlugin) => item.contentModel.modelId === model.modelId);

                return Boolean(modelPlugin);
            }
        },
        /**
         * We need fallback for field.alias because old systems did not have this field.
         * !!! do not remove !!!
         */
        CmsContentModelField: {
            alias: async (field: CmsModelField) => {
                /**
                 * When we don't have alias defined it means it's an old system so return the fieldId as alias.
                 * TODO: remove after the upgrade.
                 */
                if (field.alias === undefined) {
                    return field.fieldId;
                }
                /**
                 * If alias is null or empty, return null. This means field is not used in the GraphQL
                 */
                if (field.alias === null || field.alias === "") {
                    return null;
                }
                return field.alias;
            }
        }
    };

    let manageSchema = "";
    if (context.cms.MANAGE) {
        resolvers.Mutation = {
            createContentModel: async (_: unknown, args: CreateCmsModelArgs, context) => {
                try {
                    const model = await context.cms.createModel(args.data);
                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            createContentModelFrom: async (
                _: unknown,
                args: CreateFromCmsModelFromArgs,
                context
            ) => {
                try {
                    const model = await context.cms.createModelFrom(args.modelId, args.data);
                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateContentModel: async (_: unknown, args: UpdateCmsModelArgs, context) => {
                const { modelId, data } = args;
                try {
                    const model = await context.cms.updateModel(modelId, data);
                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteContentModel: async (_: unknown, args: DeleteCmsModelArgs, context) => {
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
            }

            input CmsFieldValidationInput {
                name: String!
                message: String
                settings: JSON
            }

            input CmsContentModelFieldInput {
                id: ID!
                label: String!
                helpText: String
                placeholderText: String
                fieldId: String!
                alias: String
                type: String!
                multipleValues: Boolean
                predefinedValues: CmsPredefinedValuesInput
                renderer: CmsFieldRendererInput
                validation: [CmsFieldValidationInput]
                listValidation: [CmsFieldValidationInput]
                settings: JSON
            }

            input CmsContentModelCreateInput {
                name: String!
                modelId: String
                group: RefInput!
                description: String
            }

            input CmsContentModelCreateFromInput {
                name: String!
                modelId: String
                group: RefInput!
                description: String
                locale: String
            }

            input CmsContentModelUpdateInput {
                name: String
                group: RefInput
                description: String
                layout: [[ID!]!]!
                fields: [CmsContentModelFieldInput!]!
                titleFieldId: String
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

    return new GraphQLSchemaPlugin<CmsContext>({
        typeDefs: /* GraphQL */ `
            type CmsFieldValidation {
                name: String!
                message: String
                settings: JSON
            }

            type CmsFieldRenderer {
                name: String
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
                fieldId: String!
                alias: String
                label: String!
                helpText: String
                placeholderText: String
                type: String!
                multipleValues: Boolean
                predefinedValues: CmsPredefinedValues
                renderer: CmsFieldRenderer
                validation: [CmsFieldValidation!]
                listValidation: [CmsFieldValidation!]
                settings: JSON
            }

            type CmsContentModel {
                name: String!
                modelId: String!
                description: String
                group: CmsContentModelGroup!
                createdOn: DateTime
                savedOn: DateTime
                createdBy: CmsCreatedBy
                fields: [CmsContentModelField!]!
                lockedFields: [JSON]
                layout: [[String!]!]!
                titleFieldId: String

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

                listContentModels: CmsContentModelListResponse
            }

            ${manageSchema}
        `,
        resolvers
    });
};

export default plugin;
