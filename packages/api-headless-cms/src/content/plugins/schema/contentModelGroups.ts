import {
    CmsContentModelGroupCreateInputType,
    CmsContentModelGroupUpdateInputType,
    CmsContext
} from "../../../types";

import { GraphQLSchemaPlugin, Resolvers } from "@webiny/handler-graphql/types";

type CreateContentModelGroupArgsType = {
    data: CmsContentModelGroupCreateInputType;
};

type ReadContentModelGroupArgsType = {
    id: string;
};

type UpdateContentModelGroupArgsType = ReadContentModelGroupArgsType & {
    data: CmsContentModelGroupUpdateInputType;
};

type DeleteContentModelGroupArgsType = {
    id: string;
};

const plugin = (context: CmsContext): GraphQLSchemaPlugin<CmsContext> => {
    let manageSchema = "";
    if (context.cms.MANAGE) {
        manageSchema = /* GraphQL */ `
            input CmsContentModelGroupInput {
                name: String
                slug: String
                description: String
                icon: String
            }

            type CmsContentModelGroupResponse {
                data: CmsContentModelGroup
                error: CmsError
            }

            type CmsContentModelGroupListResponse {
                data: [CmsContentModelGroup]
                meta: CmsListMeta
                error: CmsError
            }

            extend type Query {
                getContentModelGroup(id: ID): CmsContentModelGroupResponse
                listContentModelGroups: CmsContentModelGroupListResponse
            }

            extend type Mutation {
                createContentModelGroup(
                    data: CmsContentModelGroupInput!
                ): CmsContentModelGroupResponse

                updateContentModelGroup(
                    id: ID!
                    data: CmsContentModelGroupInput!
                ): CmsContentModelGroupResponse

                deleteContentModelGroup(id: ID!): CmsDeleteResponse
            }
        `;
    }

    let resolvers: Resolvers<CmsContext> = {};

    if (context.cms.MANAGE) {
        resolvers = {
            Query: {
                getContentModelGroup: async (_, args: ReadContentModelGroupArgsType, context) => {},
                listContentModelGroups: async (_, args, context) => {}
            },
            Mutation: {
                createContentModelGroup: async (
                    _,
                    args: CreateContentModelGroupArgsType,
                    context
                ) => {},
                updateContentModelGroup: async (
                    _,
                    args: UpdateContentModelGroupArgsType,
                    context
                ) => {},
                deleteContentModelGroup: async (
                    _,
                    args: DeleteContentModelGroupArgsType,
                    context
                ) => {}
            }
        };
    }

    return {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                type CmsContentModelGroup {
                    id: ID
                    createdOn: DateTime
                    changedOn: DateTime
                    name: String
                    contentModels: [CmsContentModel]
                    totalContentModels: Int
                    slug: String
                    description: String
                    icon: String
                    createdBy: JSON
                }
                ${manageSchema}
            `,
            resolvers
        }
    };
};

export default plugin;
