import { GraphQLSchemaPlugin } from "@webiny/graphql/types";
import merge from "lodash.merge";
import gql from "graphql-tag";
import cmsEnvironment from "./graphql/environment";
import cmsEnvironmentAlias from "./graphql/environmentAlias";

import { emptyResolver } from "@webiny/commodo-graphql";

export default () => [
    {
        name: "graphql-schema-headless",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                extend type SecurityUser @key(fields: "id") {
                    id: ID @external
                }

                input CmsSearchInput {
                    query: String
                    fields: [String]
                    operator: String
                }

                type CmsError {
                    code: String
                    message: String
                    data: JSON
                }

                type CmsCursors {
                    next: String
                    previous: String
                }

                type CmsListMeta {
                    cursors: CmsCursors
                    hasNextPage: Boolean
                    hasPreviousPage: Boolean
                    totalCount: Int
                }

                type CmsDeleteResponse {
                    data: Boolean
                    error: CmsError
                }

                extend type Query {
                    cms: CmsQuery
                }

                extend type Mutation {
                    cms: CmsMutation
                }

                type CmsQuery {
                    _empty: String
                }

                type CmsMutation {
                    _empty: String
                }

                ${cmsEnvironment.typeDefs}
                ${cmsEnvironmentAlias.typeDefs}
            `,
            resolvers: merge(
                {
                    Query: {
                        cms: emptyResolver
                    },
                    Mutation: {
                        cms: emptyResolver
                    }
                },
                cmsEnvironment.resolvers,
                cmsEnvironmentAlias.resolvers
            )
        },
        security: merge(cmsEnvironment.security, cmsEnvironmentAlias.security)
    } as GraphQLSchemaPlugin
];
