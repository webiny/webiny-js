import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { Response } from "@webiny/api-graphql";
import { ErrorResponse } from "@webiny/api-graphql";
import { ListResponse } from "@webiny/api-graphql";
import { ListErrorResponse } from "@webiny/api-graphql";
import { CreateRemoteComponentUseCase } from "~/api/features/createComponent/abstractions.js";
import { GetRemoteComponentUseCase } from "~/api/features/getComponent/abstractions.js";
import { ListRemoteComponentsUseCase } from "~/api/features/listComponents/abstractions.js";
import { UpdateRemoteComponentUseCase } from "~/api/features/updateComponent/abstractions.js";
import { DeleteRemoteComponentUseCase } from "~/api/features/deleteComponent/abstractions.js";
import { BundleRemoteComponentUseCase } from "~/api/features/bundleComponent/abstractions.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import {
    GENERATE_REMOTE_COMPONENT_TASK_ID,
    type IGenerateRemoteComponentTaskInput
} from "~/api/features/generateComponent/GenerateRemoteComponentTask.js";
import {
    REFINE_REMOTE_COMPONENT_TASK_ID,
    type IRefineRemoteComponentTaskInput
} from "~/api/features/refineComponent/RefineRemoteComponentTask.js";

interface IIdArgs {
    id: string;
}

interface ICreateArgs {
    data: CreateRemoteComponentUseCase.Input;
}

interface IUpdateArgs {
    id: string;
    data: UpdateRemoteComponentUseCase.Input;
}

interface IRefineArgs {
    data: {
        currentSource: string;
        currentCss: string;
        feedback: string;
        additionalFileIds?: string[] | null;
    };
}

interface IGenerateArgs {
    data: {
        prompt: string;
        name?: string | null;
        label?: string | null;
        description?: string | null;
        additionalFileIds?: string[] | null;
    };
}

class RemoteComponentSchema_ implements GraphQLSchemaFactory.Interface {
    async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        builder.addTypeDefs(/* GraphQL */ `
            type RemoteComponentError {
                code: String
                message: String
                data: JSON
            }

            type RemoteComponentListMeta {
                cursor: String
                hasMoreItems: Boolean!
                totalCount: Int!
            }

            type RemoteComponent {
                id: ID!
                name: String!
                label: String!
                description: String
                aiContext: String
                source: String
                css: String
                bundledJs: String
                bundledJsSha256: String
                bundledCss: String
                bundledCssSha256: String
                aiPrompt: String
                status: String!
                sdkVersion: String!
                createdOn: DateTime
                savedOn: DateTime
            }

            type RemoteComponentResponse {
                data: RemoteComponent
                error: RemoteComponentError
            }

            type RemoteComponentListResponse {
                data: [RemoteComponent!]
                meta: RemoteComponentListMeta
                error: RemoteComponentError
            }

            input CreateRemoteComponentInput {
                name: String!
                label: String!
                description: String
                aiContext: String
                source: String!
                css: String
                aiPrompt: String
                status: String
            }

            input UpdateRemoteComponentInput {
                name: String
                label: String
                description: String
                aiContext: String
                source: String
                css: String
                bundledJs: String
                bundledJsSha256: String
                bundledCss: String
                bundledCssSha256: String
                aiPrompt: String
                status: String
            }

            type RemoteComponentQuery {
                getRemoteComponent(id: ID!): RemoteComponentResponse!
                listRemoteComponents: RemoteComponentListResponse!
            }

            type GeneratedComponentOutput {
                id: ID!
            }

            type GeneratedComponentResponse {
                data: GeneratedComponentOutput
                error: RemoteComponentError
            }

            input GenerateRemoteComponentInput {
                prompt: String!
                name: String
                label: String
                description: String
                additionalFileIds: [String!]
            }

            input RefineRemoteComponentInput {
                currentSource: String!
                currentCss: String!
                feedback: String!
                additionalFileIds: [String!]
            }

            type RemoteComponentMutation {
                createRemoteComponent(data: CreateRemoteComponentInput!): RemoteComponentResponse!
                updateRemoteComponent(
                    id: ID!
                    data: UpdateRemoteComponentInput!
                ): RemoteComponentResponse!
                deleteRemoteComponent(id: ID!): BooleanResponse!
                bundleRemoteComponent(id: ID!): RemoteComponentResponse!
                generateRemoteComponent(
                    data: GenerateRemoteComponentInput!
                ): GeneratedComponentResponse!
                refineRemoteComponent(data: RefineRemoteComponentInput!): BooleanResponse!
            }

            extend type Query {
                remoteComponents: RemoteComponentQuery!
            }

            extend type Mutation {
                remoteComponents: RemoteComponentMutation!
            }
        `);

        builder.addResolver({
            path: "Query.remoteComponents",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "Mutation.remoteComponents",
            dependencies: [],
            resolver: () => () => ({})
        });

        builder.addResolver({
            path: "RemoteComponentQuery.getRemoteComponent",
            dependencies: [GetRemoteComponentUseCase],
            resolver: (useCase: GetRemoteComponentUseCase.Interface) => {
                return async ({ args }: { args: IIdArgs }) => {
                    const result = await useCase.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver({
            path: "RemoteComponentQuery.listRemoteComponents",
            dependencies: [ListRemoteComponentsUseCase],
            resolver: (useCase: ListRemoteComponentsUseCase.Interface) => {
                return async () => {
                    const result = await useCase.execute();
                    if (result.isFail()) {
                        return new ListErrorResponse(result.error);
                    }
                    return new ListResponse(result.value.items, result.value.meta);
                };
            }
        });

        builder.addResolver<ICreateArgs>({
            path: "RemoteComponentMutation.createRemoteComponent",
            dependencies: [CreateRemoteComponentUseCase],
            resolver: (useCase: CreateRemoteComponentUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args.data);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<IUpdateArgs>({
            path: "RemoteComponentMutation.updateRemoteComponent",
            dependencies: [UpdateRemoteComponentUseCase],
            resolver: (useCase: UpdateRemoteComponentUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args.id, args.data);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<IIdArgs>({
            path: "RemoteComponentMutation.deleteRemoteComponent",
            dependencies: [DeleteRemoteComponentUseCase],
            resolver: (useCase: DeleteRemoteComponentUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(true);
                };
            }
        });

        builder.addResolver<IIdArgs>({
            path: "RemoteComponentMutation.bundleRemoteComponent",
            dependencies: [BundleRemoteComponentUseCase],
            resolver: (useCase: BundleRemoteComponentUseCase.Interface) => {
                return async ({ args }) => {
                    const result = await useCase.execute(args.id);
                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }
                    return new Response(result.value);
                };
            }
        });

        builder.addResolver<IGenerateArgs>({
            path: "RemoteComponentMutation.generateRemoteComponent",
            dependencies: [TaskService],
            resolver: (taskService: TaskService.Interface) => {
                return async ({ args }) => {
                    const result = await taskService.trigger<IGenerateRemoteComponentTaskInput>({
                        definition: GENERATE_REMOTE_COMPONENT_TASK_ID,
                        input: {
                            prompt: args.data.prompt,
                            name: args.data.name ?? null,
                            label: args.data.label ?? null,
                            description: args.data.description ?? null,
                            additionalFileIds: args.data.additionalFileIds ?? null
                        }
                    });

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response({ id: result.value.id });
                };
            }
        });

        builder.addResolver<IRefineArgs>({
            path: "RemoteComponentMutation.refineRemoteComponent",
            dependencies: [TaskService],
            resolver: (taskService: TaskService.Interface) => {
                return async ({ args }) => {
                    const result = await taskService.trigger<IRefineRemoteComponentTaskInput>({
                        definition: REFINE_REMOTE_COMPONENT_TASK_ID,
                        input: {
                            currentSource: args.data.currentSource,
                            currentCss: args.data.currentCss,
                            feedback: args.data.feedback,
                            additionalFileIds: args.data.additionalFileIds ?? null
                        }
                    });

                    if (result.isFail()) {
                        return new ErrorResponse(result.error);
                    }

                    return new Response(true);
                };
            }
        });

        return builder;
    }
}

export const RemoteComponentSchema = GraphQLSchemaFactory.createImplementation({
    implementation: RemoteComponentSchema_,
    dependencies: []
});
