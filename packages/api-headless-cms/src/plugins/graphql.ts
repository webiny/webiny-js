import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { merge } from "lodash";
import cmsEnvironment from "./graphql/environment";
import cmsEnvironmentAlias from "./graphql/environmentAlias";
// import cmsAccessToken from "./graphql/accessToken";
import cmsSettings from "./graphql/settings";
import cmsContentModelGroup from "./graphql/contentModelGroup";

const emptyResolver = () => ({});

export default () => [
    {
        name: "graphql-schema-headless",
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
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

                ${cmsSettings.typeDefs}
                ${cmsEnvironment.typeDefs}
                ${cmsEnvironmentAlias.typeDefs}
                ${cmsContentModelGroup.typeDefs}
            `,
            // ${cmsAccessToken.typeDefs}
            resolvers: merge(
                {
                    Query: {
                        cms: emptyResolver
                    },
                    Mutation: {
                        cms: emptyResolver
                    }
                },
                cmsSettings.resolvers,
                cmsEnvironment.resolvers,
                cmsEnvironmentAlias.resolvers,
                cmsContentModelGroup.resolvers
                // cmsAccessToken.resolvers
            )
        }
    } as GraphQLSchemaPlugin
];
