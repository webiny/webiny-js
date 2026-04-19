import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { SaveSettingsUseCase } from "~/api/features/SaveSettings/index.js";

class BaseGraphQLSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): Promise<CoreGraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type AiModel {
                providerId: String!
                providerName: String!
                modelId: String!
                modelName: String!
            }

            type AiPowerupsProvider {
                name: String!
                description: String
                model: String!
                apiKey: String!
            }

            type AiPowerupsPersona {
                name: String!
                description: String!
            }

            type AiPowerupsSettings {
                providers: [AiPowerupsProvider!]!
                personas: [AiPowerupsPersona!]!
            }

            input AiPowerupsProviderInput {
                name: String!
                description: String
                model: String!
                apiKey: String!
            }

            input AiPowerupsPersonaInput {
                name: String!
                description: String!
            }

            type AiPowerups {
                listModels: [AiModel!]!
                getSettings: AiPowerupsSettings
            }

            type AiPowerupsMutation {
                saveSettings(
                    providers: [AiPowerupsProviderInput!]!
                    personas: [AiPowerupsPersonaInput!]!
                ): AiPowerupsSettings
            }

            extend type Query {
                aiPowerups: AiPowerups
            }

            extend type Mutation {
                aiPowerups: AiPowerupsMutation
            }
        `);

        builder.addResolver({
            path: "Query.aiPowerups",
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "Mutation.aiPowerups",
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "AiPowerups.listModels",
            dependencies: [Ai],
            resolver: (ai: Ai.Interface) => {
                return async () => ai.listModels();
            }
        });

        builder.addResolver({
            path: "AiPowerups.getSettings",
            dependencies: [GetSettingsUseCase],
            resolver: (useCase: GetSettingsUseCase.Interface) => {
                return async () => {
                    const result = await useCase.execute();
                    return result.isOk()
                        ? (result.value ?? { providers: [], personas: [] })
                        : { providers: [], personas: [] };
                };
            }
        });

        builder.addResolver({
            path: "AiPowerupsMutation.saveSettings",
            dependencies: [SaveSettingsUseCase],
            resolver: (useCase: SaveSettingsUseCase.Interface) => {
                return async ({ args }: { args: { providers: any[]; personas: any[] } }) => {
                    const result = await useCase.execute({
                        providers: args.providers,
                        personas: args.personas
                    });
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                };
            }
        });

        return builder;
    }
}

export const BaseGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
    implementation: BaseGraphQLSchemaImpl,
    dependencies: []
});
