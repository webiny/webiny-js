import { ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { parseIdentifier } from "@webiny/utils";

import { removeAcoRecordPrefix } from "~/utils/acoRecordId";
import { checkPermissions } from "~/utils/checkPermissions";
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
        SearchRecord: {
            id: async parent => {
                const { id } = parseIdentifier(parent.id);
                return removeAcoRecordPrefix(id);
            }
        },
        SearchQuery: {
            getRecord: async (_, { id }, context) => {
                try {
                    await checkPermissions(context);
                    return resolve(() => context.aco.search.get(id));
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            listRecords: async (_, args: any, context) => {
                try {
                    await checkPermissions(context);
                    const [entries, meta] = await context.aco.search.list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        SearchMutation: {
            createRecord: async (_, { data }, context) => {
                try {
                    await checkPermissions(context);
                    return resolve(() => context.aco.search.create(data));
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            updateRecord: async (_, { id, data }, context) => {
                try {
                    await checkPermissions(context);
                    return resolve(() => context.aco.search.update(id, data));
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            deleteRecord: async (_, { id }, context) => {
                try {
                    await checkPermissions(context);
                    return resolve(() => context.aco.search.delete(id));
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
});
