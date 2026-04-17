import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";

class LanguagesGraphQLSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): Promise<CoreGraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type AiPowerups {
                listModels: [String!]!
            }

            extend type Query {
                aiPowerups: AiPowerups
            }
        `);

        // Namespace resolver
        builder.addResolver({
            path: "Query.aiPowerups",
            resolver: () => {
                return () => ({});
            }
        });

        // List languages resolver
        builder.addResolver({
            path: "AiPowerups.listModels",
            dependencies: [],
            resolver: () => {
                return async () => {
                    return [];
                };
            }
        });

        return builder;
    }
}

export const BaseGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: LanguagesGraphQLSchemaImpl,
    dependencies: []
});
