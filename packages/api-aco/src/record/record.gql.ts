import { ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

import { resolve } from "~/utils/resolve";

import { AcoContext } from "~/types";
import { parseIdentifier } from "@webiny/utils";
import { removeAcoRecordPrefix } from "~/utils/acoRecordId";

export const searchRecordSchema = new GraphQLSchemaPlugin<AcoContext>({
    typeDefs: /* GraphQL */ `
        type SearchRecord {
            id: ID!
            type: String!
            location: SearchLocationType!
            title: String!
            content: String
            data: JSON!
            tags: [String!]!
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
            tags: [String!]
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
            tags_in: [String!]
            tags_startsWith: String
            tags_not_startsWith: String
            createdBy: ID
        }

        input SearchRecordTagListWhereInput {
            type: String
            tags_in: [String!]
            tags_startsWith: String
            tags_not_startsWith: String
            AND: [SearchRecordTagListWhereInput!]
            OR: [SearchRecordTagListWhereInput!]
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

        type SearchRecordTagListResponse {
            data: [String!]
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
            listTags(where: SearchRecordTagListWhereInput): SearchRecordTagListResponse
        }

        extend type SearchMutation {
            createRecord(data: SearchRecordCreateInput!): SearchRecordResponse
            updateRecord(id: ID!, data: SearchRecordUpdateInput!): SearchRecordResponse
            deleteRecord(id: ID!): AcoBooleanResponse
        }
    `,
    resolvers: {
        SearchRecord: {
            id: async parent => {
                const { id } = parseIdentifier(parent.id);
                return removeAcoRecordPrefix(id);
            }
        },
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
            },
            listTags: async (_, args: any, context) => {
                try {
                    const [tags, meta] = await context.aco.search.listTags(args);
                    return new ListResponse(tags, meta);
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
