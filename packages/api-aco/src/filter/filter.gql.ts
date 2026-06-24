import { ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses.js";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin.js";

import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";

import type { AcoContext } from "~/types.js";
import { AcoFilterCrud } from "~/features/folder/shared/abstractions.js";

export const filterSchema = new GraphQLSchemaPlugin<AcoContext>({
    typeDefs: /* GraphQL */ `
        enum OperationEnum {
            AND
            OR
        }

        type GroupFilter {
            field: String!
            condition: String!
            value: String!
        }

        type Group {
            operation: OperationEnum!
            filters: [GroupFilter]!
        }

        type Filter {
            id: ID!
            name: String!
            description: String
            namespace: String!
            operation: OperationEnum!
            groups: [Group]!
            createdOn: DateTime
            modifiedOn: DateTime
            savedOn: DateTime
            createdBy: AcoUser
            modifiedBy: AcoUser
            savedBy: AcoUser
        }

        input GroupFilterInput {
            field: String!
            condition: String!
            value: String!
        }

        input GroupInput {
            operation: OperationEnum!
            filters: [GroupFilterInput]!
        }

        input FilterCreateInput {
            id: ID!
            name: String!
            description: String
            namespace: String!
            operation: OperationEnum!
            groups: [GroupInput]!
        }

        input FilterUpdateInput {
            name: String
            description: String
            namespace: String
            operation: OperationEnum
            groups: [GroupInput]
        }

        input FiltersListWhereInput {
            namespace: String
        }

        type FilterResponse {
            data: Filter
            error: AcoError
        }

        type FilterListResponse {
            data: [Filter]
            error: AcoError
        }

        extend type AcoQuery {
            getFilter(id: ID!): FilterResponse
            listFilters(
                where: FiltersListWhereInput!
                limit: Int
                after: String
                sort: AcoSort
            ): FilterListResponse
        }

        extend type AcoMutation {
            createFilter(data: FilterCreateInput!): FilterResponse
            updateFilter(id: ID!, data: FilterUpdateInput!): FilterResponse
            deleteFilter(id: ID!): AcoBooleanResponse
        }
    `,
    resolvers: {
        AcoQuery: {
            getFilter: async (_, { id }, context) => {
                return resolve(() => {
                    ensureAuthentication(context);
                    return context.container.resolve(AcoFilterCrud).get(id);
                });
            },
            listFilters: async (_, args: any, context) => {
                try {
                    ensureAuthentication(context);
                    const [entries, meta] = await context.container
                        .resolve(AcoFilterCrud)
                        .list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        AcoMutation: {
            createFilter: async (_, { data }, context) => {
                return resolve(() => {
                    ensureAuthentication(context);
                    return context.container.resolve(AcoFilterCrud).create(data);
                });
            },
            updateFilter: async (_, { id, data }, context) => {
                return resolve(() => {
                    ensureAuthentication(context);
                    return context.container.resolve(AcoFilterCrud).update(id, data);
                });
            },
            deleteFilter: async (_, { id }, context) => {
                return resolve(() => {
                    ensureAuthentication(context);
                    return context.container.resolve(AcoFilterCrud).delete(id);
                });
            }
        }
    }
});
