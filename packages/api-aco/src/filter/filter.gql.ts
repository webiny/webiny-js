import { ErrorResponse, ListResponse } from "@webiny/handler-graphql/responses";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";

import { checkPermissions } from "~/utils/checkPermissions";
import { resolve } from "~/utils/resolve";

import { AcoContext } from "~/types";

export const filterSchema = new GraphQLSchemaPlugin<AcoContext>({
    typeDefs: /* GraphQL */ `
        enum OperationEnum {
            AND
            OR
        }

        type Filter {
            id: ID!
            name: String!
            description: String
            modelId: String!
            operation: OperationEnum!
            groups: [JSON]!
            savedOn: DateTime
            createdOn: DateTime
            createdBy: AcoUser
        }

        input FilterCreateInput {
            id: ID!
            name: String!
            description: String
            modelId: String!
            operation: OperationEnum!
            groups: [JSON]!
        }

        input FilterUpdateInput {
            name: String
            description: String
            modelId: String
            operation: OperationEnum
            groups: [JSON]
        }

        input FiltersListWhereInput {
            modelId: String
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
                    checkPermissions(context);
                    return context.aco.filter.get(id);
                });
            },
            listFilters: async (_, args: any, context) => {
                try {
                    checkPermissions(context);
                    const [entries, meta] = await context.aco.filter.list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        AcoMutation: {
            createFilter: async (_, { data }, context) => {
                return resolve(() => {
                    checkPermissions(context);
                    return context.aco.filter.create(data);
                });
            },
            updateFilter: async (_, { id, data }, context) => {
                return resolve(() => {
                    checkPermissions(context);
                    return context.aco.filter.update(id, data);
                });
            },
            deleteFilter: async (_, { id }, context) => {
                return resolve(() => {
                    checkPermissions(context);
                    return context.aco.filter.delete(id);
                });
            }
        }
    }
});
