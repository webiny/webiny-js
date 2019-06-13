import { dummyResolver } from "webiny-api/graphql";

export const CmsRootTypes = {
    typeDefs: () => [
        /* GraphQL */ `
            type Query {
                _empty: String
            }

            type Mutation {
                _empty: String
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
        `
    ],
    resolvers: {
        Query: {
            cms: dummyResolver
        },
        Mutation: {
            cms: dummyResolver
        }
    }
};
