import { ErrorResponse, ListResponse } from "@webiny/api-graphql/responses.js";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ensureAuthentication } from "~/utils/ensureAuthentication.js";
import { resolve } from "~/utils/resolve.js";
import { AcoFilterCrud } from "~/features/folder/shared/abstractions.js";

export const addFilterSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(/* GraphQL */ `
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
    `);

    builder.addResolver({
        path: "AcoQuery.getFilter",
        dependencies: [AcoFilterCrud],
        resolver(filterCrud) {
            return ({ args, context }) =>
                resolve(() => {
                    ensureAuthentication(context);
                    return filterCrud.get(args.id);
                });
        }
    });

    builder.addResolver({
        path: "AcoQuery.listFilters",
        dependencies: [AcoFilterCrud],
        resolver(filterCrud) {
            return async ({ args, context }) => {
                try {
                    ensureAuthentication(context);
                    const [entries, meta] = await filterCrud.list(args);
                    return new ListResponse(entries, meta);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            };
        }
    });

    builder.addResolver({
        path: "AcoMutation.createFilter",
        dependencies: [AcoFilterCrud],
        resolver(filterCrud) {
            return ({ args, context }) =>
                resolve(() => {
                    ensureAuthentication(context);
                    return filterCrud.create(args.data);
                });
        }
    });

    builder.addResolver({
        path: "AcoMutation.updateFilter",
        dependencies: [AcoFilterCrud],
        resolver(filterCrud) {
            return ({ args, context }) =>
                resolve(() => {
                    ensureAuthentication(context);
                    return filterCrud.update(args.id, args.data);
                });
        }
    });

    builder.addResolver({
        path: "AcoMutation.deleteFilter",
        dependencies: [AcoFilterCrud],
        resolver(filterCrud) {
            return ({ args, context }) =>
                resolve(() => {
                    ensureAuthentication(context);
                    return filterCrud.delete(args.id);
                });
        }
    });
};
