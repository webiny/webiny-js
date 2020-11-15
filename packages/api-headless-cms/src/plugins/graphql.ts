import { GraphQLSchemaPlugin } from "@webiny/graphql/types";
import { merge } from "lodash";
import gql from "graphql-tag";
import cmsEnvironment from "./graphql/environment";
import cmsEnvironmentAlias from "./graphql/environmentAlias";
import cmsAccessToken from "./graphql/accessToken";
import cmsInstall from "./graphql/install";

import { emptyResolver } from "@webiny/commodo-graphql";

export default () => [
    {
        name: "graphql-schema-headless",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
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

                type CmsBooleanResponse {
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

                ${cmsInstall.typeDefs}
                ${cmsEnvironment.typeDefs}
                ${cmsEnvironmentAlias.typeDefs}
                ${cmsAccessToken.typeDefs}
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
                cmsInstall.resolvers,
                cmsEnvironment.resolvers,
                cmsEnvironmentAlias.resolvers,
                cmsAccessToken.resolvers
            )
        }
    } as GraphQLSchemaPlugin
];
