import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { createPagesSchema } from "~/graphql/pages/pages.gql.js";
import { createRedirectsSchema } from "./redirects/redirects.gql.js";

const emptyResolver = () => ({});

const baseSchema = new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        type WbQuery {
            _empty: String
        }

        type WbMutation {
            _empty: String
        }

        type WbMeta {
            hasMoreItems: Boolean
            totalCount: Int
            cursor: String
        }

        type WbIdentity {
            id: ID
            displayName: String
            type: String
        }

        input WbIdentityInput {
            id: String!
            displayName: String!
            type: String!
        }

        type WbLocation {
            folderId: String
        }

        input WbLocationInput {
            folderId: String
        }

        input WbLocationWhereInput {
            folderId: ID
            folderId_in: [ID!]
            folderId_not: ID
            folderId_not_in: [ID!]
        }

        type WbError {
            code: String
            message: String
            data: JSON
            stack: String
        }

        type WbBooleanResponse {
            data: Boolean
            error: WbError
        }

        extend type Query {
            websiteBuilder: WbQuery
        }

        extend type Mutation {
            websiteBuilder: WbMutation
        }
    `,
    resolvers: {
        Query: {
            websiteBuilder: emptyResolver
        },
        Mutation: {
            websiteBuilder: emptyResolver
        }
    }
});

export const createGraphQL = () => {
    return [baseSchema, createPagesSchema(), createRedirectsSchema()];
};
