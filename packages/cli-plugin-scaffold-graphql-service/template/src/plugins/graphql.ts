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
                createdOn: DateTime
            }

            input EntityInput {
                id: ID
                title: String!
            }

            input EntityListWhere {
                title: String
            }

            input EntityListSort {
                title: Int
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
                entities: emptyResolver
            },
            Mutation: {
                entities: emptyResolver
            },
            EntityQuery: {
                getEntity: hasScope("entities:get")(resolveGet(entityFetcher)),
                listEntities: hasScope("entities:list")(resolveList(entityFetcher))
            },
            EntityMutation: {
                createEntity: hasScope("entities:create")(resolveCreate(entityFetcher)),
                updateEntity: hasScope("entities:update")(resolveUpdate(entityFetcher)),
                deleteEntity: hasScope("entities:delete")(resolveDelete(entityFetcher))
            }
        }
    }
};

export default plugin;
