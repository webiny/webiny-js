import { ErrorResponse, ListResponse, Response } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { ACOContext } from "~/types";

export const linksSchema = new GraphQLSchemaPlugin<ACOContext>({
    typeDefs: /* GraphQL */ `
        type Link {
            id: ID!
            linkId: ID!
            folderId: ID!
            createdOn: DateTime
            createdBy: FolderCreatedBy
        }

        input LinkCreateInput {
            id: ID!
            folderId: ID!
        }

        input LinkUpdateInput {
            folderId: ID!
        }

        input LinksListWhereInput {
            folderId: ID!
        }

        type LinkResponse {
            data: Link
            error: FolderError
        }

        type LinksListResponse {
            data: [Link]
            meta: ListMeta
            error: FolderError
        }

        extend type FoldersQuery {
            getLink(id: ID!): LinkResponse
            listLinks(where: LinksListWhereInput!, limit: Int, after: String): LinksListResponse
        }

        extend type FoldersMutation {
            createLink(data: LinkCreateInput!): LinkResponse
            updateLink(id: ID!, data: LinkUpdateInput!): LinkResponse
            deleteLink(id: ID!): FolderBooleanResponse
        }
    `,
    resolvers: {
        FoldersQuery: {
            getLink: async (_, { id }, context) => {
                try {
                    const link = await context.folders.getLink(id);
                    return new Response(link);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            listLinks: async (_, { where, limit, after }, context) => {
                try {
                    const [data, meta] = await context.folders.listLinks({ where, limit, after });
                    return new ListResponse(data, meta);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            }
        },

        FoldersMutation: {
            createLink: async (_, { data }, context) => {
                try {
                    const link = await context.folders.createLink(data);
                    return new Response(link);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            updateLink: async (_, { id, data }, context) => {
                try {
                    const link = await context.folders.updateLink(id, data);
                    return new Response(link);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            deleteLink: async (_, { id }, context) => {
                try {
                    await context.folders.deleteLink(id);
                    return new Response(true);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            }
        }
    }
});
