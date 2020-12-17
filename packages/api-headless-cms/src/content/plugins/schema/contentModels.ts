import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import {
    CmsContentModelCreateInputType,
    CmsContentModelUpdateInputType,
    CmsContext
} from "@webiny/api-headless-cms/types";

type CreateContentModelArgsType = {
    data: CmsContentModelCreateInputType;
};

type ReadContentModelArgsType = {
    id: string;
};

type UpdateContentModelArgsType = ReadContentModelArgsType & {
    data: CmsContentModelUpdateInputType;
};

type DeleteContentModelArgsType = {
    id: string;
};

const plugin = (context: CmsContext): GraphQLSchemaPlugin<CmsContext> => {
    const resolvers: Record<string, any> = {
        Query: {
            getContentModel: async (
                _: unknown,
                args: ReadContentModelArgsType,
                context: CmsContext
            ) => {
                try {
                    const model = await context.cms.models.get(args.id);
                    return new Response(model);
                } catch (ex) {
                    return new ErrorResponse({
                        message: ex.message,
                        data: ex.data,
                        code: ex.code || "GET_CONTENT_MODEL_FAILED"
                    });
                }
            },
            listContentModels: async (_: unknown, __: unknown, context: CmsContext) => {
                try {
                    const model = await context.cms.models.list();
                    return new Response(model);
                } catch (ex) {
                    return new ErrorResponse({
                        message: ex.message,
                        data: ex.data,
                        code: ex.code || "LIST_CONTENT_MODEL_FAILED"
                    });
                }
            }
        }
    };

    let manageSchema = "";
    if (context.cms.MANAGE) {
        resolvers.Mutation = {
            createContentModel: async (
                _: unknown,
                args: CreateContentModelArgsType,
                context: CmsContext
            ) => {
                const identity = context.security.getIdentity();

                const { data } = args;
                const createdBy = {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                };

                try {
                    const model = await context.cms.models.create(data, createdBy);
                    return new Response(model);
                } catch (ex) {
                    return new ErrorResponse({
                        message: ex.message,
                        data: ex.data,
                        code: ex.code || "CREATE_CONTENT_MODEL_FAILED"
                    });
                }
            },
            updateContentModel: async (
                _: unknown,
                args: UpdateContentModelArgsType,
                context: CmsContext
            ) => {
                const { id, data } = args;
                try {
                    const model = await context.cms.models.update(id, data);
                    return new Response(model);
                } catch (ex) {
                    return new ErrorResponse({
                        message: ex.message,
                        data: ex.data,
                        code: ex.code || "UPDATE_CONTENT_MODEL_FAILED"
                    });
                }
            },
            deleteContentModel: async (
                _: unknown,
                args: DeleteContentModelArgsType,
                context: CmsContext
            ) => {
                const { id } = args;
                try {
                    await context.cms.models.delete(id);
                    return new Response(true);
                } catch (ex) {
                    return new ErrorResponse({
                        message: ex.message,
                        data: ex.data,
                        code: ex.code || "DELETE_CONTENT_MODEL_FAILED"
                    });
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
                settings: JSON
            }

            input CmsContentModelCreateInput {
                name: String!
                modelId: String
                group: ID!
                description: String
            }

            input CmsContentModelUpdateInput {
                name: String
                modelId: String
                group: ID
                description: String
                layout: [[ID!]!]!
                fields: [CmsContentModelFieldInput!]!
                titleFieldId: String
            }

            extend type Mutation {
                createContentModel(data: CmsContentModelCreateInput!): CmsContentModelResponse

                updateContentModel(
                    id: ID!
                    data: CmsContentModelUpdateInput!
                ): CmsContentModelResponse

                deleteContentModel(id: ID!): CmsDeleteResponse
            }
        `;
    }

    return {
        type: "graphql-schema",
        schema: {
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
                    settings: JSON
                }

                type CmsContentModel {
                    id: ID!
                    name: String!
                    modelId: String!
                    description: String
                    group: CmsContentModelGroup!
                    createdOn: DateTime!
                    savedOn: DateTime
                    createdBy: JSON!
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
                    getContentModel(id: ID, where: JSON, sort: String): CmsContentModelResponse

                    listContentModels: CmsContentModelListResponse
                }

                ${manageSchema}
            `,
            resolvers
        }
    };
};

export default plugin;
