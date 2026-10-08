import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { createModelSchemaKey } from "@webiny/api-headless-cms/utils/createModelSchemaKey.js";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum.js";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields.js";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import type { Context, IListTaskLogParams, IListTaskParams, ITask, ITaskLog } from "~/api/types.js";
import { TaskLogModelProvider } from "~/api/domain/task/abstractions.js";
import { TaskModelProvider } from "~/api/domain/task/abstractions.js";
import { ListTaskLogsUseCase } from "~/api/features/ListTaskLogs/index.js";
import { GetTaskUseCase } from "~/api/features/GetTask/index.js";
import { ListTasksUseCase } from "~/api/features/ListTasks/index.js";
import { DeleteTaskUseCase } from "~/api/features/DeleteTask/index.js";
import { ListTaskDefinitionsUseCase } from "~/api/features/ListTaskDefinitions/abstractions.js";
import { TriggerTaskUseCase } from "~/api/features/TriggerTask/abstractions.js";
import { AbortTaskUseCase } from "~/api/features/AbortTask/abstractions.js";
import { GetBackgroundTaskSettingsRepository } from "~/api/features/GetBackgroundTaskSettings/abstractions.js";
import { UpdateBackgroundTaskSettingsUseCase } from "~/api/features/UpdateBackgroundTaskSettings/abstractions.js";
import type { IUpdateBackgroundTaskSettingsInput } from "~/api/features/UpdateBackgroundTaskSettings/abstractions.js";
import { emptyResolver, resolve, resolveList } from "./utils.js";
import { checkPermissions } from "./checkPermissions.js";

interface IGetTaskQueryParams {
    id: string;
}

interface IAbortTaskMutationParams {
    id: string;
    message?: string;
}

interface ITriggerTaskMutationParams {
    name?: string;
    definition: string;
    input?: Record<string, any>;
    delay?: number;
}

interface IDeleteTaskMutationParams {
    id: string;
}

interface IUpdateSettingsArgs {
    input: IUpdateBackgroundTaskSettingsInput;
}

interface IResolverParams<TArgs = unknown, TParent = unknown> {
    parent: TParent;
    args: TArgs;
    context: Context;
}

function addQueryResolvers(builder: GraphQLSchemaFactory.SchemaBuilder): void {
    builder.addResolver({
        path: "Query.backgroundTasks",
        resolver: () => emptyResolver
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskQuery.getTask",
        dependencies: [GetTaskUseCase],
        resolver: (getTask: GetTaskUseCase.Interface) => {
            return ({ args, context }: IResolverParams<IGetTaskQueryParams>) => {
                return resolve(async () => {
                    await checkPermissions(context, { rwd: "r" });
                    return await getTask.execute(args.id);
                });
            };
        }
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskQuery.listTasks",
        dependencies: [ListTasksUseCase],
        resolver: (listTasks: ListTasksUseCase.Interface) => {
            return ({ args, context }: IResolverParams<IListTaskParams>) => {
                return resolveList(async () => {
                    await checkPermissions(context, { rwd: "r" });
                    return await listTasks.execute(args);
                });
            };
        }
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskQuery.listDefinitions",
        dependencies: [ListTaskDefinitionsUseCase],
        resolver: (listTaskDefinitions: ListTaskDefinitionsUseCase.Interface) => {
            return ({ context }: IResolverParams) => {
                return resolve(async () => {
                    await checkPermissions(context, { rwd: "r" });
                    // Do not output private tasks.
                    return listTaskDefinitions.execute().filter(item => {
                        return !item.isPrivate;
                    });
                });
            };
        }
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskQuery.listLogs",
        dependencies: [ListTaskLogsUseCase],
        resolver: (listTaskLogs: ListTaskLogsUseCase.Interface) => {
            return ({ args, context }: IResolverParams<IListTaskLogParams>) => {
                return resolveList(async () => {
                    await checkPermissions(context, { rwd: "r" });
                    const result = await listTaskLogs.execute(args);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
            };
        }
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskQuery.getSettings",
        dependencies: [GetBackgroundTaskSettingsRepository],
        resolver: (repository: GetBackgroundTaskSettingsRepository.Interface) => {
            return ({ context }: IResolverParams) => {
                return resolve(async () => {
                    await checkPermissions(context, { rwd: "r" });
                    const result = await repository.execute();
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
            };
        }
    });
}

function addMutationResolvers(builder: GraphQLSchemaFactory.SchemaBuilder): void {
    builder.addResolver({
        path: "Mutation.backgroundTasks",
        resolver: () => emptyResolver
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskMutation.abortTask",
        dependencies: [AbortTaskUseCase],
        resolver: (abortTask: AbortTaskUseCase.Interface) => {
            return async ({ args, context }: IResolverParams<IAbortTaskMutationParams>) => {
                await checkPermissions(context, { rwd: "w" });
                return resolve<ITask>(async () => {
                    const result = await abortTask.execute(args);
                    if (result.isOk()) {
                        return result.value;
                    }

                    throw result.error;
                });
            };
        }
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskMutation.triggerTask",
        dependencies: [TriggerTaskUseCase],
        resolver: (triggerTask: TriggerTaskUseCase.Interface) => {
            return async ({ args, context }: IResolverParams<ITriggerTaskMutationParams>) => {
                await checkPermissions(context, { rwd: "w" });
                return resolve<ITask>(async () => {
                    const result = await triggerTask.execute(args);
                    if (result.isOk()) {
                        return result.value;
                    }

                    throw result.error;
                });
            };
        }
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskMutation.deleteTask",
        dependencies: [DeleteTaskUseCase],
        resolver: (deleteTask: DeleteTaskUseCase.Interface) => {
            return async ({ args, context }: IResolverParams<IDeleteTaskMutationParams>) => {
                await checkPermissions(context, { rwd: "d" });
                return resolve(async () => {
                    const result = await deleteTask.execute(args.id);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return true;
                });
            };
        }
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskMutation.updateSettings",
        dependencies: [UpdateBackgroundTaskSettingsUseCase],
        resolver: (updateSettings: UpdateBackgroundTaskSettingsUseCase.Interface) => {
            return ({ args }: IResolverParams<IUpdateSettingsArgs>) => {
                return resolve(async () => {
                    const result = await updateSettings.execute(args.input);
                    if (result.isFail()) {
                        throw result.error;
                    }
                    return result.value;
                });
            };
        }
    });
}

function addFieldResolvers(builder: GraphQLSchemaFactory.SchemaBuilder): void {
    builder.addResolver({
        path: "WebinyBackgroundTask.logs",
        dependencies: [ListTaskLogsUseCase],
        resolver: (listTaskLogs: ListTaskLogsUseCase.Interface) => {
            return async ({ parent, args }: IResolverParams<IListTaskLogParams, ITask>) => {
                const result = await listTaskLogs.execute({
                    sort: ["createdBy_ASC"],
                    limit: 10000,
                    ...args,
                    where: {
                        ...args?.where,
                        task: parent.id
                    }
                });
                if (result.isFail()) {
                    throw result.error;
                }
                return result.value.items;
            };
        }
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskLog.task",
        dependencies: [GetTaskUseCase],
        resolver: (getTask: GetTaskUseCase.Interface) => {
            return async ({ parent }: IResolverParams<unknown, ITaskLog>) => {
                return await getTask.execute(parent.task);
            };
        }
    });
}

/**
 * The background-tasks GraphQL schema. Its shape depends on the CMS task/log content models, which
 * are loaded when the schema is composed. The settings schema lives here too, because it extends
 * the task schema's `WebinyBackgroundTaskQuery`/`Mutation` types.
 */
class BackgroundTasksGraphQLSchemaImpl implements GraphQLSchemaFactory.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly taskModelProvider: TaskModelProvider.Interface,
        private readonly logModelProvider: TaskLogModelProvider.Interface,
        private readonly listModelsUseCase: ListModelsUseCase.Interface,
        private readonly fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface
    ) {}

    public async getSchemaKey(): Promise<string> {
        if (!this.tenantContext.getTenant()) {
            return "BackgroundTasks:no-tenant";
        }

        const { taskModel, logModel, models } = await this.loadInputs();
        const modelKey = createModelSchemaKey([taskModel, logModel], models);
        return `BackgroundTasks:${modelKey}`;
    }

    public async execute(
        builder: GraphQLSchemaFactory.SchemaBuilder
    ): Promise<GraphQLSchemaFactory.SchemaBuilder> {
        if (!this.tenantContext.getTenant()) {
            return builder;
        }

        const typeDefs = await this.createTypeDefs();

        builder.addTypeDefs(typeDefs);
        addQueryResolvers(builder);
        addMutationResolvers(builder);
        addFieldResolvers(builder);

        return builder;
    }

    private async loadInputs() {
        const taskModel = await this.taskModelProvider.get();
        const logModel = await this.logModelProvider.get();

        const models = await this.identityContext.withoutAuthorization(async () => {
            const modelsResult = await this.listModelsUseCase.execute({ includePrivate: false });
            return modelsResult.value.filter(model => model.fields.length > 0);
        });

        return { taskModel, logModel, models };
    }

    private async createTypeDefs(): Promise<string> {
        const { taskModel, logModel, models } = await this.loadInputs();
        const fieldRegistry = this.fieldRegistry;

        const taskFields = renderFields({
            models,
            model: taskModel,
            fields: taskModel.fields,
            type: "manage",
            fieldRegistry
        });

        const logFields = renderFields({
            models,
            model: logModel,
            fields: logModel.fields.filter(field => field.fieldId !== "task"),
            type: "manage",
            fieldRegistry
        });

        const listTasksFilterFieldsRender = renderListFilterFields({
            model: taskModel,
            fields: taskModel.fields,
            type: "manage",
            fieldRegistry,
            excludeFields: ["entryId"]
        });

        const listLogsFilterFieldsRender = renderListFilterFields({
            model: logModel,
            fields: logModel.fields,
            type: "manage",
            fieldRegistry,
            excludeFields: ["entryId"]
        });

        const sortTasksEnumRender = renderSortEnum({
            model: taskModel,
            fields: taskModel.fields,
            fieldRegistry,
            sorters: []
        });

        const sortLogsEnumRender = renderSortEnum({
            model: logModel,
            fields: logModel.fields,
            fieldRegistry,
            sorters: []
        });

        return /* GraphQL */ `
            type WebinyBackgroundTaskError {
                message: String
                code: String
                data: JSON
                stack: String
            }

            ${taskFields.map(f => f.typeDefs).join("\n")}
            ${logFields.map(f => f.typeDefs).join("\n")}

            type WebinyBackgroundTask {
                id: String!
                createdOn: DateTime!
                savedOn: DateTime
                createdBy: WebinyBackgroundTaskIdentity!
                logs(
                    where: WebinyBackgroundTaskLogListWhereInput
                    limit: Number
                    sort: [WebinyBackgroundTaskLogListSorter!]
                ): [WebinyBackgroundTaskLog!]!
                ${taskFields.map(f => f.fields).join("\n")}
            }

            type WebinyBackgroundTaskResponse {
                data: WebinyBackgroundTask
                error: WebinyBackgroundTaskError
            }

            type WebinyBackgroundTaskMeta {
                cursor: String
                hasMoreItems: Boolean!
                totalCount: Int!
            }

            type WebinyBackgroundTaskListResponse {
                data: [WebinyBackgroundTask!]
                meta: WebinyBackgroundTaskMeta
                error: WebinyBackgroundTaskError
            }

            type WebinyBackgroundTaskLog {
                id: String!
                createdOn: DateTime!
                createdBy: WebinyBackgroundTaskIdentity!
                task: WebinyBackgroundTask!
                ${logFields.map(f => f.fields).join("\n")}
            }

            type WebinyBackgroundTaskLogListResponse {
                data: [WebinyBackgroundTaskLog!]
                meta: WebinyBackgroundTaskMeta
                error: WebinyBackgroundTaskError
            }

            type WebinyBackgroundTaskDefinition {
                id: String!
                title: String!
                description: String
            }

            type WebinyBackgroundTaskListDefinitionsResponse {
                data: [WebinyBackgroundTaskDefinition!]
                error: WebinyBackgroundTaskError
            }

            type WebinyBackgroundTaskIdentity {
                id: String!
                displayName: String!
                type: String
            }

            type WebinyBackgroundTaskTriggerResponse {
                data: WebinyBackgroundTask
                error: WebinyBackgroundTaskError
            }

            type WebinyBackgroundTaskDeleteResponse {
                data: Boolean
                error: WebinyBackgroundTaskError
            }

            input WebinyBackgroundTaskListWhereInput {
                ${listTasksFilterFieldsRender.allFiltersAsString() || "_empty: String"}
            }

            input WebinyBackgroundTaskLogListWhereInput {
                ${listLogsFilterFieldsRender.allFiltersAsString() || "_empty: String"}
            }

            enum WebinyBackgroundTaskListSorter {
                ${sortTasksEnumRender}
            }

            enum WebinyBackgroundTaskLogListSorter {
                ${sortLogsEnumRender}
            }

            type WebinyBackgroundTaskQuery {
                _empty: String
            }

            type WebinyBackgroundTaskMutation {
                _empty: String
            }

            extend type Query {
                backgroundTasks: WebinyBackgroundTaskQuery
            }

            extend type Mutation {
                backgroundTasks: WebinyBackgroundTaskMutation
            }

            extend type WebinyBackgroundTaskQuery {
                getTask(id: ID!): WebinyBackgroundTaskResponse!
                listTasks(
                    where: WebinyBackgroundTaskListWhereInput
                    sort: [WebinyBackgroundTaskListSorter!]
                    limit: Int
                    after: String
                    search: String
                ): WebinyBackgroundTaskListResponse!
                listDefinitions: WebinyBackgroundTaskListDefinitionsResponse!

                listLogs(
                    where: WebinyBackgroundTaskLogListWhereInput
                    sort: [WebinyBackgroundTaskLogListSorter!]
                    limit: Int
                    after: String
                    search: String
                ): WebinyBackgroundTaskLogListResponse!
            }

            extend type WebinyBackgroundTaskMutation {
                triggerTask(definition: String!, input: JSON, name: String, delay: Number): WebinyBackgroundTaskTriggerResponse!
                abortTask(id: ID!, message: String): WebinyBackgroundTaskResponse!
                deleteTask(id: ID!): WebinyBackgroundTaskDeleteResponse!
            }

            type WebinyBackgroundTaskSettings {
                retentionDays: Int
            }

            type WebinyBackgroundTaskSettingsResponse {
                data: WebinyBackgroundTaskSettings
                error: WebinyBackgroundTaskError
            }

            input UpdateBackgroundTaskSettingsInput {
                retentionDays: Int
            }

            extend type WebinyBackgroundTaskQuery {
                getSettings: WebinyBackgroundTaskSettingsResponse
            }

            extend type WebinyBackgroundTaskMutation {
                updateSettings(
                    input: UpdateBackgroundTaskSettingsInput!
                ): WebinyBackgroundTaskSettingsResponse
            }
        `;
    }
}

export const BackgroundTasksGraphQLSchema = GraphQLSchemaFactory.createImplementation({
    implementation: BackgroundTasksGraphQLSchemaImpl,
    dependencies: [
        TenantContext,
        IdentityContext,
        TaskModelProvider,
        TaskLogModelProvider,
        ListModelsUseCase,
        CmsModelFieldToGraphQLRegistry
    ]
});
