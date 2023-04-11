import { ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

import { resolve } from "~/utils/resolve";

import { AcoContext } from "~/types";

export const searchRecordSchema = new GraphQLSchemaPlugin<AcoContext>({
    typeDefs: /* GraphQL */ `
        type SearchRecord {
            id: ID!
            type: String!
            location: SearchLocationType!
            title: String!
            content: String
            data: JSON
            tags: [String!]
            savedOn: DateTime
            createdOn: DateTime
            createdBy: AcoUser
        }

        type SearchLocationType {
            folderId: ID!
        }

        input SearchLocationInput {
            folderId: ID!
        }

        input SearchRecordCreateInput {
            id: String!
            type: String!
            title: String!
            content: String
            location: SearchLocationInput!
            data: JSON
        }

        input SearchRecordUpdateInput {
            title: String
            content: String
            location: SearchLocationInput
            data: JSON
            tags: [String!]
        }

        input SearchRecordListWhereInput {
            type: String!
            location: SearchLocationInput
        }

        type SearchRecordResponse {
            data: SearchRecord
            error: AcoError
        }

        type SearchRecordListResponse {
            data: [SearchRecord]
            error: AcoError
            meta: AcoMeta
        }

        extend type SearchQuery {
            getRecord(id: ID!): SearchRecordResponse
            listRecords(
                where: SearchRecordListWhereInput
                search: String
                limit: Int
                after: String
                sort: AcoSort
            ): SearchRecordListResponse
        }

        extend type SearchMutation {
            createRecord(data: SearchRecordCreateInput!): SearchRecordResponse
            updateRecord(id: ID!, data: SearchRecordUpdateInput!): SearchRecordResponse
            deleteRecord(id: ID!): AcoBooleanResponse
        }
    `,
    resolvers: {
        SearchQuery: {
            getRecord: async (_, { id }, context) => {
                return resolve(() => context.aco.search.get(id));
            },
            listRecords: async (_, args: any, context) => {
                try {
                    const [entries, meta] = await context.aco.search.list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        SearchMutation: {
            createRecord: async (_, { data }, context) => {
                return resolve(() => context.aco.search.create(data));
            },
            updateRecord: async (_, { id, data }, context) => {
                return resolve(() => context.aco.search.update(id, data));
            },
            deleteRecord: async (_, { id }, context) => {
                return resolve(() => context.aco.search.delete(id));
            }
        }
    }
});
