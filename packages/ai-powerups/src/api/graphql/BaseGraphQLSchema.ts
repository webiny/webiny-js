import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { SaveSettingsUseCase } from "~/api/features/SaveSettings/index.js";

class BaseGraphQLSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): Promise<CoreGraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type AiPowerupsSettings {
                data: JSON
            }

            type AiPowerups {
                listModels: [String!]!
                getSettings: AiPowerupsSettings
            }

            type AiPowerupsMutation {
                saveSettings(data: JSON!): AiPowerupsSettings
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
                    return { data: result.isOk() ? result.value : null };
                };
            }
        });

        builder.addResolver({
            path: "AiPowerupsMutation.saveSettings",
            dependencies: [SaveSettingsUseCase],
            resolver: (useCase: SaveSettingsUseCase.Interface) => {
                return async ({ args }: { args: { data: any } }) => {
                    const result = await useCase.execute(args.data);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return { data: result.value };
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
