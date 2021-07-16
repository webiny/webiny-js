import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { CmsContentModelCreateInput, CmsContentModelUpdateInput, CmsContext } from "../../../types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { Resolvers } from "@webiny/handler-graphql/types";

interface CreateContentModelArgs {
    data: CmsContentModelCreateInput;
}

interface ReadContentModelArgs {
    modelId: string;
}

interface UpdateContentModelArgs extends ReadContentModelArgs {
    data: CmsContentModelUpdateInput;
}

interface DeleteContentModelArgs {
    modelId: string;
}

const plugin = (context: CmsContext): GraphQLSchemaPlugin<CmsContext> => {
    const resolvers: Resolvers<CmsContext> = {
        Query: {
            getContentModel: async (_: unknown, args: ReadContentModelArgs, context) => {
                try {
                    const model = await context.cms.models.get(args.modelId);
                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listContentModels: async (_: unknown, __: unknown, context: CmsContext) => {
                try {
                    const model = await context.cms.models.list();
                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    };

    let manageSchema = "";
    if (context.cms.MANAGE) {
        resolvers.Mutation = {
            createContentModel: async (_: unknown, args: CreateContentModelArgs, context) => {
                try {
                    const model = await context.cms.models.create(args.data);
                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateContentModel: async (_: unknown, args: UpdateContentModelArgs, context) => {
                const { modelId, data } = args;
                try {
                    const model = await context.cms.models.update(modelId, data);
                    return new Response(model);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteContentModel: async (_: unknown, args: DeleteContentModelArgs, context) => {
                const { modelId } = args;
                try {
                    await context.cms.models.delete(modelId);
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
            }

            type CmsPredefinedValues {
                enabled: Boolean
                values: [CmsPredefinedValue]
            }

            type CmsContentModelField {
                id: ID!
                fieldId: String!
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
                createdOn: DateTime!
                savedOn: DateTime
                createdBy: CmsCreatedBy!
                fields: [CmsContentModelField!]!
                lockedFields: [JSON]
                layout: [[String!]!]!
                titleFieldId: String
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
