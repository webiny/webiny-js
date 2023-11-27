import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { SecurityContext } from "~/types";

export const PARALLEL_QUERY = /* GraphQL */ `
    query ParallelQueries {
        withoutAuthorization
        withAuthorization
        security {
            listApiKeys {
                data {
                    id
                    token
                }
                error {
                    code
                }
            }
        }
    }
`;

export const withoutAuthorizationPlugin = new GraphQLSchemaPlugin<SecurityContext>({
    typeDefs: /* GraphQL*/ `
        extend type Query {
            withoutAuthorization: String!
            withAuthorization: String!
        }
    `,
    resolvers: {
        Query: {
            withoutAuthorization(_, args, context) {
                return context.security.withoutAuthorization(async () => {
                    const permissions = await context.security.getPermissions("security.apiKey");
                    if (!permissions.length) {
                        return "NOT_AUTHORIZED";
                    }
                    return "YOUR DATA!";
                });
            },
            async withAuthorization(_, args, context) {
                const permissions = await context.security.getPermissions("security.apiKey");
                if (!permissions.length) {
                    return "NOT_AUTHORIZED";
                }
                return "AUTHORIZED";
            }
        }
    }
});
