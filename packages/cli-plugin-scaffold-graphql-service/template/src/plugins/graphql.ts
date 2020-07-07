import gql from "graphql-tag";
import { GraphQLSchemaPlugin } from "@webiny/graphql/types";
import { hasScope } from "@webiny/api-security";
import {
    emptyResolver,
    resolveCreate,
    resolveDelete,
    resolveGet,
    resolveList,
    resolveUpdate
} from "@webiny/commodo-graphql";

const entityFetcher = ctx => ctx.models.Entity;

/**
 * As the name itself suggests, the "graphql-schema" plugin enables us to define our service's GraphQL schema.
 * Use the "schema" and "resolvers" properties to define GraphQL types and resolvers, respectively.
 * Resolvers can be made from scratch, but to make it a bit easier, we rely on a couple of built-in generic
 * resolvers, imported from the "@webiny/commodo-graphql" package.
 *
 * @see https://docs.webiny.com/docs/api-development/graphql
 */
const plugin: GraphQLSchemaPlugin = {
    type: "graphql-schema",
    name: "graphql-schema-entities",
    schema: {
        typeDefs: gql`
            type EntityDeleteResponse {
                data: Boolean
                error: EntityError
            }

            type EntityCursors {
                next: String
                previous: String
            }

            type EntityListMeta {
                cursors: EntityCursors
                hasNextPage: Boolean
                hasPreviousPage: Boolean
                totalCount: Int
            }

            type EntityError {
                code: String
                message: String
                data: JSON
            }

            type Entity {
                id: ID
                title: String
                description: String
                isNice: Boolean
                createdOn: DateTime
            }

            input EntityInput {
                id: ID
                title: String!
                description: String
                isNice: Boolean
            }

            input EntityListWhere {
                title: String
                isNice: Boolean
            }

            input EntityListSort {
                title: Int
                isNice: Boolean
                createdOn: Int
            }

            type EntityResponse {
                data: Entity
                error: EntityError
            }

            type EntityListResponse {
                data: [Entity]
                meta: EntityListMeta
                error: EntityError
            }

            type EntityQuery {
                getEntity(id: ID): EntityResponse

                listEntities(
                    where: EntityListWhere
                    sort: EntityListSort
                    limit: Int
                    after: String
                    before: String
                ): EntityListResponse
            }

            type EntityMutation {
                createEntity(data: EntityInput!): EntityResponse

                updateEntity(id: ID!, data: EntityInput!): EntityResponse

                deleteEntity(id: ID!): EntityDeleteResponse
            }

            extend type Query {
                entities: EntityQuery
            }

            extend type Mutation {
                entities: EntityMutation
            }
        `,
        resolvers: {
            Query: {
                // Needs to be here, otherwise the resolvers below cannot return any result.
                entities: emptyResolver
            },
            Mutation: {
                // Needs to be here, otherwise the resolvers below cannot return any result.
                entities: emptyResolver
            },
            EntityQuery: {
                // With the generic resolvers, we also rely on the "hasScope" helper function from the
                // "@webiny/api-security" package, in order to define the required security scopes (permissions).
                getEntity: hasScope("entities:get")(resolveGet(entityFetcher)),
                listEntities: hasScope("entities:list")(resolveList(entityFetcher))
            },
            EntityMutation: {
                // With the generic resolvers, we also rely on the "hasScope" helper function from the
                // "@webiny/api-security" package, in order to define the required security scopes (permissions).
                createEntity: hasScope("entities:create")(resolveCreate(entityFetcher)),
                updateEntity: hasScope("entities:update")(resolveUpdate(entityFetcher)),
                deleteEntity: hasScope("entities:delete")(resolveDelete(entityFetcher))
            }
        }
    }
};

export default plugin;
