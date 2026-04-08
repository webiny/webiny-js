import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { Response, ErrorResponse } from "@webiny/handler-graphql";
import { ListLanguagesUseCase } from "~/api/features/listLanguages/index.js";

class LanguagesGraphQLSchemaImpl implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type LanguagesQuery {
                listLanguages: LanguagesListResponse!
            }

            type Language {
                id: ID!
                code: String!
                name: String!
                direction: String
                isDefault: Boolean
                enabled: Boolean
            }

            type LanguagesListResponse {
                data: [Language!]
                error: LanguagesError
            }

            type LanguagesError {
                code: String!
                message: String!
                data: JSON
            }

            extend type Query {
                languages: LanguagesQuery
            }
        `);

        // Namespace resolver
        builder.addResolver({
            path: "Query.languages",
            resolver: () => {
                return () => ({});
            }
        });

        // List languages resolver
        builder.addResolver({
            path: "LanguagesQuery.listLanguages",
            dependencies: [ListLanguagesUseCase],
            resolver: (listLanguages: ListLanguagesUseCase.Interface) => {
                return async () => {
                    const result = await listLanguages.execute();

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(result.value);
                };
            }
        });

        return builder;
    }
}

export const LanguagesGraphQLSchema = GraphQLSchemaFactory.createImplementation({
    implementation: LanguagesGraphQLSchemaImpl,
    dependencies: []
});
