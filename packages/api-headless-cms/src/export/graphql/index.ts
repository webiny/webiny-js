import { CmsGraphQLSchemaPlugin } from "~/plugins";
import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/handler";
import { CmsContext } from "~/types";

const plugin = new CmsGraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        type CmsExportStructureResponse {
            data: String
            error: CmsError
        }

        input CmsImportStructureGroupInput {
            id: ID!
            name: String!
            slug: String
            description: String
            icon: String!
        }

        input CmsImportStructureModelInput {
            name: String!
            singularApiName: String!
            pluralApiName: String!
            modelId: String!
            group: String!
            icon: String
            description: String
            layout: [[ID!]!]!
            fields: [CmsContentModelFieldInput!]!
            titleFieldId: String!
            descriptionFieldId: String
            imageFieldId: String
            tags: [String!]
        }

        enum CmsImportGroupStructureAction {
            create
            update
            code
            none
        }

        enum CmsImportModelStructureAction {
            create
            update
            code
            none
        }

        input CmsImportStructureInput {
            groups: [CmsImportStructureGroupInput!]!
            models: [CmsImportStructureModelInput!]!
        }

        type CmsImportValidateResponseDataGroupResultItem {
            id: String
            name: String
        }

        type CmsImportValidateResponseDataGroupResult {
            group: CmsImportValidateResponseDataGroupResultItem!
            error: CmsError
            action: CmsImportGroupStructureAction
        }

        type CmsImportValidateResponseDataModelResultItem {
            modelId: String
            name: String
            group: String
        }

        type CmsImportValidateResponseDataModelResult {
            model: CmsImportValidateResponseDataModelResultItem!
            related: [String!]
            error: CmsError
            action: CmsImportModelStructureAction
        }

        type CmsImportValidateResponseData {
            groups: [CmsImportValidateResponseDataGroupResult!]!
            models: [CmsImportValidateResponseDataModelResult!]!
            message: String!
        }

        type CmsImportValidateResponse {
            data: CmsImportValidateResponseData
            error: CmsError
        }

        type CmsImportStructureResponseDataGroupResultItem {
            id: String!
            name: String!
        }
        type CmsImportStructureResponseDataGroupResult {
            group: CmsImportStructureResponseDataGroupResultItem!
            error: CmsError
            action: CmsImportGroupStructureAction
            imported: Boolean
        }

        type CmsImportStructureResponseDataResultItem {
            modelId: String!
            name: String!
            group: String!
        }

        type CmsImportStructureResponseDataModelResult {
            model: CmsImportStructureResponseDataResultItem!
            related: [String!]
            error: CmsError
            action: CmsImportModelStructureAction
            imported: Boolean
        }

        type CmsImportStructureResponseData {
            groups: [CmsImportStructureResponseDataGroupResult!]!
            models: [CmsImportStructureResponseDataModelResult!]!
            message: String
        }

        type CmsImportStructureResponse {
            data: CmsImportStructureResponseData
            error: CmsError
        }

        extend type Query {
            exportStructure(models: [String!]): CmsExportStructureResponse!
        }

        extend type Mutation {
            validateImportStructure(data: CmsImportStructureInput!): CmsImportValidateResponse!
            importStructure(data: CmsImportStructureInput!): CmsImportStructureResponse!
        }
    `,
    resolvers: {
        Query: {
            exportStructure: async (_, args, context) => {
                try {
                    const result = await context.cms.export.structure({
                        models: args.models
                    });
                    return new Response(JSON.stringify(result));
                } catch (ex) {
                    return new ErrorResponse(ex);
                }
            }
        },
        Mutation: {
            validateImportStructure: async (_, args, context) => {
                try {
                    const result = await context.cms.importing.validate({
                        data: args.data
                    });
                    return new Response(result);
                } catch (ex) {
                    return new ErrorResponse(ex);
                }
            },
            importStructure: async (_, args, context) => {
                try {
                    const result = await context.cms.importing.structure({
                        data: args.data
                    });
                    return new Response(result);
                } catch (ex) {
                    return new ErrorResponse(ex);
                }
            }
        }
    }
});
plugin.name = "headless-cms.graphql.export";

export const createExportGraphQL = () => {
    return new ContextPlugin<CmsContext>(async context => {
        if (!context.cms.MANAGE) {
            return;
        }
        context.plugins.register(plugin);
    });
};
