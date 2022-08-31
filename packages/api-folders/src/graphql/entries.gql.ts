import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { FoldersContext } from "~/types";

export default new GraphQLSchemaPlugin<FoldersContext>({
    typeDefs: /* GraphQL */ `
        type Entry {
            id: ID!
            folderId: ID!
            externalId: ID!
            createdOn: DateTime
            createdBy: FolderCreatedBy
        }

        input EntryCreateInput {
            folderId: ID!
            externalId: ID!
        }

        input EntryUpdateInput {
            folderId: ID!
        }

        input EntriesListWhereInput {
            folderId: ID!
        }

        type EntryResponse {
            data: Entry
            error: FolderError
        }

        type EntriesListResponse {
            data: [Entry]
            error: FolderError
        }

        extend type FoldersQuery {
            getEntry(id: ID!): EntryResponse
            listEntries(where: EntriesListWhereInput!): EntriesListResponse
        }

        extend type FoldersMutation {
            createEntry(data: EntryCreateInput!): EntryResponse
            updateEntry(id: ID!, data: EntryUpdateInput!): EntryResponse
            deleteEntry(id: ID!): FolderBooleanResponse
        }
    `,
    resolvers: {
        FoldersQuery: {
            getEntry: async (_, { id }, context) => {
                try {
                    const entry = await context.folders.getEntry(id);
                    return new Response(entry);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            listEntries: async (_, { where }, context) => {
                try {
                    const entries = await context.folders.listEntries({ where });
                    return new Response(entries);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            }
        },

        FoldersMutation: {
            createEntry: async (_, { data }, context) => {
                try {
                    const entry = await context.folders.createEntry(data);
                    return new Response(entry);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            updateEntry: async (_, { id, data }, context) => {
                try {
                    const entry = await context.folders.updateEntry(id, data);
                    return new Response(entry);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            },
            deleteEntry: async (_, { id }, context) => {
                try {
                    await context.folders.deleteEntry(id);
                    return new Response(true);
                } catch (error) {
                    return new ErrorResponse(error);
                }
            }
        }
    }
});
