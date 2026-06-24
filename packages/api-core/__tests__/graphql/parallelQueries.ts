import { GraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.public.js";
import type { IGraphQLSchemaBuilder } from "@webiny/handler-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";

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

class ParallelQueriesSchemaFactoryImpl {
    async execute(builder: IGraphQLSchemaBuilder): Promise<IGraphQLSchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            extend type Query {
                withoutAuthorization: String!
                withAuthorization: String!
            }
        `);

        builder.addResolver({
            path: "Query.withoutAuthorization",
            dependencies: [],
            resolver:
                () =>
                ({ context }: any) =>
                    context.container.resolve(IdentityContext).withoutAuthorization(async () => {
                        const permissions = await context.container
                            .resolve(IdentityContext)
                            .getPermissions("security.apiKey");
                        if (!permissions.length) {
                            return "NOT_AUTHORIZED";
                        }
                        return "YOUR DATA!";
                    })
        });

        builder.addResolver({
            path: "Query.withAuthorization",
            dependencies: [],
            resolver:
                () =>
                async ({ context }: any) => {
                    const permissions = await context.container
                        .resolve(IdentityContext)
                        .getPermissions("security.apiKey");
                    if (!permissions.length) {
                        return "NOT_AUTHORIZED";
                    }
                    return "AUTHORIZED";
                }
        });

        return builder;
    }
}

export const withoutAuthorizationFactory = GraphQLSchemaFactory.createImplementation({
    implementation: ParallelQueriesSchemaFactoryImpl,
    dependencies: []
});
