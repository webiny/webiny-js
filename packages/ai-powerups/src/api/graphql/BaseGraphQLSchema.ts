import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.core.js";
import { staticSchemaKey } from "@webiny/api-graphql/graphql/staticSchemaKey.js";
import { Response, ErrorResponse } from "@webiny/api-graphql/responses.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { UpdateSettingsUseCase } from "~/api/features/UpdateSettings/index.js";
import { ListModelsUseCase } from "~/api/features/ListModels/index.js";
import { ListAiCapabilitiesUseCase } from "~/api/features/Capabilities/index.js";
import { QueueWbGeneratePageContentUseCase } from "~/api/features/QueueWbGeneratePageContent/index.js";
import { QueueCmsGenerateEntryContentUseCase } from "~/api/features/QueueCmsGenerateEntryContent/index.js";
import type { IWbGeneratePageContentTaskInput } from "~/api/features/WbGeneratePageContent/WbGeneratePageContentTask.js";
import type { ICmsGenerateEntryContentTaskInput } from "~/api/features/CmsGenerateEntryContent/CmsGenerateEntryContentTask.js";
import { AiPowerUpsSettingsGraphQLMapper } from "./abstractions.js";

class BaseGraphQLSchemaImpl implements CoreGraphQLSchemaFactory.Interface {
    public getSchemaKey = staticSchemaKey("ai-powerups/BaseGraphQLSchemaImpl");

    async execute(
        builder: CoreGraphQLSchemaFactory.SchemaBuilder
    ): Promise<CoreGraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type AiModel {
                providerId: String!
                providerName: String!
                modelId: String!
                modelName: String!
                deprecated: Date
                endOfLife: Date
            }

            type AiCapability {
                id: String!
                label: String!
                description: String!
                defaultRole: String!
            }

            type AiPowerUpsQuery {
                listModels: [AiModel!]!
                listCapabilities: [AiCapability!]!
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
                    additionalFileIds: [String!]
                ): JSON!
                generateEntryContent(
                    prompt: String!
                    modelId: String!
                    projectId: String
                    excludedFileIds: [String!]
                    readerPersonaId: String
                    writerPersonaId: String
                    additionalFileIds: [String!]
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

        /*
         * Whatever features registered. The admin screen has no list of its own, so a feature that
         * registers a capability gets a settings row without touching the admin app.
         */
        builder.addResolver({
            path: "AiPowerUpsQuery.listCapabilities",
            dependencies: [ListAiCapabilitiesUseCase],
            resolver: (useCase: ListAiCapabilitiesUseCase.Interface) => {
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

        builder.addResolver<ICmsGenerateEntryContentTaskInput>({
            path: "AiPowerUpsMutation.generateEntryContent",
            dependencies: [QueueCmsGenerateEntryContentUseCase],
            resolver: (useCase: QueueCmsGenerateEntryContentUseCase.Interface) => {
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
