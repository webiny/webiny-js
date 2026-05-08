import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { Response, ErrorResponse } from "@webiny/handler-graphql/responses.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { UpdateSettingsUseCase } from "~/api/features/UpdateSettings/index.js";
import { AiPowerUpsSettingsGraphQLMapper } from "./abstractions.js";
import {
    WB_GENERATE_PAGE_CONTENT_TASK_ID,
    type IWbGeneratePageContentTaskInput
} from "~/api/features/WbGeneratePageContent/WbGeneratePageContentTask.js";

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
                generatePageContent(prompt: String!, components: JSON!, tools: JSON!, projectId: String, excludedFileIds: [String!], readerPersonaId: String, writerPersonaId: String): JSON!
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
            dependencies: [Ai],
            resolver: (ai: Ai.Interface) => {
                return async () => ai.listModels();
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
            dependencies: [TaskService],
            resolver: (taskService: TaskService.Interface) => {
                return async ({ args }) => {
                    const result = await taskService.trigger<IWbGeneratePageContentTaskInput>({
                        definition: WB_GENERATE_PAGE_CONTENT_TASK_ID,
                        input: {
                            prompt: args.prompt,
                            components: args.components,
                            tools: args.tools,
                            projectId: args.projectId ?? null,
                            excludedFileIds: args.excludedFileIds ?? null,
                            readerPersonaId: args.readerPersonaId ?? null,
                            writerPersonaId: args.writerPersonaId ?? null
                        }
                    });

                    if (result.isFail()) {
                        throw result.error;
                    }

                    return { id: result.value.id };
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
