import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { Response, ErrorResponse } from "@webiny/handler-graphql/responses.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { UpdateSettingsUseCase } from "~/api/features/UpdateSettings/index.js";
import { ListModelsUseCase } from "~/api/features/ListModels/index.js";
import { QueueWbGeneratePageContentUseCase } from "~/api/features/WbGeneratePageContent/index.js";
import type { IWbGeneratePageContentTaskInput } from "~/api/features/WbGeneratePageContent/WbGeneratePageContentTask.js";
import { AiPowerUpsSettingsGraphQLMapper } from "./abstractions.js";

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

            type AiPowerUpsQuery {
                listModels: [AiModel!]!
                getSettings: JSON
            }

            type AiPowerUpsError {
                code: String
                message: String
                data: JSON
                stack: String
            }

            type AiPowerUpsSettingsResponse {
                data: JSON
                error: AiPowerUpsError
            }

            type AiPowerUpsMutation {
                updateSettings(input: JSON!): AiPowerUpsSettingsResponse!
                generatePageContent(
                    prompt: String!
                    components: JSON!
                    tools: JSON!
                    projectId: String
                    excludedFileIds: [String!]
                    readerPersonaId: String
                    writerPersonaId: String
                ): JSON!
            }

            extend type Query {
                aiPowerUps: AiPowerUpsQuery
            }

            extend type Mutation {
                aiPowerUps: AiPowerUpsMutation
            }
        `);

        builder.addResolver({
            path: "Query.aiPowerUps",
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "Mutation.aiPowerUps",
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "AiPowerUpsQuery.listModels",
            dependencies: [ListModelsUseCase],
            resolver: (useCase: ListModelsUseCase.Interface) => {
                return async () => {
                    const result = await useCase.execute();
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                };
            }
        });

        builder.addResolver({
            path: "AiPowerUpsQuery.getSettings",
            dependencies: [GetSettingsUseCase, AiPowerUpsSettingsGraphQLMapper],
            resolver: (
                useCase: GetSettingsUseCase.Interface,
                mapper: AiPowerUpsSettingsGraphQLMapper.Interface
            ) => {
                return async () => {
                    const result = await useCase.execute();
                    if (result.isFail()) {
                        throw result.error;
                    }

                    return mapper.toApi(result.value);
                };
            }
        });

        builder.addResolver<IWbGeneratePageContentTaskInput>({
            path: "AiPowerUpsMutation.generatePageContent",
            dependencies: [QueueWbGeneratePageContentUseCase],
            resolver: (useCase: QueueWbGeneratePageContentUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args);
                    if (result.isFail()) {
                        throw result.error;
                    }

                    return result.value;
                };
            }
        });

        builder.addResolver<{ input: Record<string, unknown> }>({
            path: "AiPowerUpsMutation.updateSettings",
            dependencies: [
                GetSettingsUseCase,
                UpdateSettingsUseCase,
                AiPowerUpsSettingsGraphQLMapper
            ],
            resolver: (
                getSettings: GetSettingsUseCase.Interface,
                updateSettings: UpdateSettingsUseCase.Interface,
                mapper: AiPowerUpsSettingsGraphQLMapper.Interface
            ) => {
                return async ({ args }) => {
                    const currentResult = await getSettings.execute();
                    if (currentResult.isFail()) {
                        return new ErrorResponse(currentResult.error);
                    }

                    const assembled = await mapper.fromApi(args.input, currentResult.value);
                    const result = await updateSettings.execute(assembled);

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(await mapper.toApi(result.value));
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
