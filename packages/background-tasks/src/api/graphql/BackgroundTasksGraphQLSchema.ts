import { GraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum.js";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields.js";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import type { Context, IListTaskLogParams, IListTaskParams, ITask, ITaskLog } from "~/api/types.js";
import { TasksCrud } from "~/api/TasksCrud.js";
import { ListTaskDefinitionsUseCase } from "~/api/features/ListTaskDefinitions/abstractions.js";
import { TriggerTaskUseCase } from "~/api/features/TriggerTask/abstractions.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/abstractions.js";
import { GetTaskUseCase } from "~/api/features/GetTask/abstractions.js";
import { TaskDefinitionNotFoundError, TaskNotFoundError } from "~/api/domain/errors.js";
import { AbortTaskUseCase } from "~/api/features/AbortTask/abstractions.js";
import { GetBackgroundTaskSettingsRepository } from "~/api/features/GetBackgroundTaskSettings/abstractions.js";
import { UpdateBackgroundTaskSettingsUseCase } from "~/api/features/UpdateBackgroundTaskSettings/abstractions.js";
import type { IUpdateBackgroundTaskSettingsInput } from "~/api/features/UpdateBackgroundTaskSettings/abstractions.js";
import { emptyResolver, resolve, resolveList } from "./utils.js";
import { checkPermissions } from "./checkPermissions.js";
import { getPrivateDefinitionIds } from "./getPrivateDefinitionIds.js";

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
        dependencies: [TasksCrud, ListTaskDefinitionsUseCase],
        resolver: (
            tasksCrud: TasksCrud.Interface,
            listTaskDefinitions: ListTaskDefinitionsUseCase.Interface
        ) => {
            return ({ args, context }: IResolverParams<IGetTaskQueryParams>) => {
                return resolve(async () => {
                    await checkPermissions(context, { rwd: "r" });
                    const task = await tasksCrud.getTask(args.id);
                    // R180: a private task is answered like a missing one.
                    const privateIds = getPrivateDefinitionIds(listTaskDefinitions.execute());
                    if (task && privateIds.includes(task.definitionId)) {
                        return null;
                    }
                    return task;
                });
            };
        }
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskQuery.listTasks",
        dependencies: [TasksCrud, ListTaskDefinitionsUseCase],
        resolver: (
            tasksCrud: TasksCrud.Interface,
            listTaskDefinitions: ListTaskDefinitionsUseCase.Interface
        ) => {
            return ({ args, context }: IResolverParams<IListTaskParams>) => {
                return resolveList(async () => {
                    await checkPermissions(context, { rwd: "r" });
                    // R180: private tasks are filtered by the storage, so the
                    // cursor, `hasMoreItems` and `totalCount` only ever count public tasks. The
                    // caller's own `definitionId_not_in` is kept.
                    const privateIds = getPrivateDefinitionIds(listTaskDefinitions.execute());
                    if (privateIds.length === 0) {
                        return await tasksCrud.listTasks(args);
                    }
                    return await tasksCrud.listTasks({
                        ...args,
                        where: {
                            ...args?.where,
                            definitionId_not_in: [
                                ...(args?.where?.definitionId_not_in || []),
                                ...privateIds
                            ]
                        }
                    });
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
        dependencies: [TasksCrud, ListTaskDefinitionsUseCase],
        resolver: (
            tasksCrud: TasksCrud.Interface,
            listTaskDefinitions: ListTaskDefinitionsUseCase.Interface
        ) => {
            return ({ args, context }: IResolverParams<IListTaskLogParams>) => {
                return resolveList(async () => {
                    await checkPermissions(context, { rwd: "r" });
                    const privateIds = getPrivateDefinitionIds(listTaskDefinitions.execute());
                    if (privateIds.length === 0) {
                        return await tasksCrud.listLogs(args);
                    }

                    // R180. A query for one task: when it is private, or the read
                    // answers null (missing, or the read failed: fail closed), answer what a missing
                    // task answers, an empty list, without querying the logs.
                    const requestedTaskId = args?.where?.task;
                    if (requestedTaskId) {
                        const requestedTask = await tasksCrud.getTask(requestedTaskId);
                        if (!requestedTask || privateIds.includes(requestedTask.definitionId)) {
                            return {
                                items: [],
                                meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
                            };
                        }
                    }

                    // Any other query: drop the logs of private tasks, and of tasks whose read
                    // answers null (orphans, or a failed read: fail closed; hiding an orphan is
                    // harmless), from the page. A log only carries its task id, so the tasks of
                    // the page are read once each.
                    const result = await tasksCrud.listLogs(args);
                    const taskIds = Array.from(new Set(result.items.map(log => log.task)));
                    const tasks = await Promise.all(taskIds.map(id => tasksCrud.getTask(id)));
                    const hiddenTaskIds = new Set<string>();
                    taskIds.forEach((taskId, index) => {
                        const task = tasks[index];
                        if (!task || privateIds.includes(task.definitionId)) {
                            hiddenTaskIds.add(taskId);
                        }
                    });
                    if (hiddenTaskIds.size === 0) {
                        return result;
                    }

                    const items = result.items.filter(log => !hiddenTaskIds.has(log.task));
                    const dropped = result.items.length - items.length;
                    return {
                        items,
                        meta: { ...result.meta, totalCount: result.meta.totalCount - dropped }
                    };
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
        dependencies: [AbortTaskUseCase, GetTaskUseCase, ListTaskDefinitionsUseCase],
        resolver: (
            abortTask: AbortTaskUseCase.Interface,
            getTask: GetTaskUseCase.Interface,
            listTaskDefinitions: ListTaskDefinitionsUseCase.Interface
        ) => {
            return async ({ args, context }: IResolverParams<IAbortTaskMutationParams>) => {
                await checkPermissions(context, { rwd: "w" });
                return resolve<ITask>(async () => {
                    // R180: a private task is refused with the error a missing
                    // task gets from `TaskService.abort`. A null read (the task is missing or
                    // the read failed) is refused the same way without calling the use case:
                    // fail closed, and the answer is identical to the missing-task answer.
                    const task = await getTask.execute(args.id);
                    const privateIds = getPrivateDefinitionIds(listTaskDefinitions.execute());
                    if (!task || privateIds.includes(task.definitionId)) {
                        throw new TaskNotFoundError();
                    }

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
        dependencies: [TriggerTaskUseCase, GetRunnableTaskDefinitionUseCase],
        resolver: (
            triggerTask: TriggerTaskUseCase.Interface,
            getRunnableTaskDefinition: GetRunnableTaskDefinitionUseCase.Interface
        ) => {
            return async ({ args, context }: IResolverParams<ITriggerTaskMutationParams>) => {
                await checkPermissions(context, { rwd: "w" });
                return resolve<ITask>(async () => {
                    // A private definition is an internal contract between the code that
                    // registers it and the code that triggers it through `TaskService.trigger`.
                    // GraphQL refuses it exactly like an unknown definition, so a caller cannot
                    // tell the two apart and cannot start it with input of their choice.
                    const definition = getRunnableTaskDefinition.execute(args.definition);
                    if (definition.isFail() || definition.value.isPrivate) {
                        throw new TaskDefinitionNotFoundError(args.definition);
                    }

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
        dependencies: [TasksCrud, ListTaskDefinitionsUseCase],
        resolver: (
            tasksCrud: TasksCrud.Interface,
            listTaskDefinitions: ListTaskDefinitionsUseCase.Interface
        ) => {
            return async ({ args, context }: IResolverParams<IDeleteTaskMutationParams>) => {
                await checkPermissions(context, { rwd: "d" });
                return resolve(async () => {
                    // R180: a private task is refused with the error a missing
                    // task gets from `TasksCrud.deleteTask`. A null read (missing, or the read
                    // failed) is refused the same way without calling `deleteTask`: fail closed.
                    const task = await tasksCrud.getTask(args.id);
                    const privateIds = getPrivateDefinitionIds(listTaskDefinitions.execute());
                    if (!task || privateIds.includes(task.definitionId)) {
                        throw new TaskNotFoundError();
                    }

                    return await tasksCrud.deleteTask(args.id);
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
        dependencies: [TasksCrud],
        resolver: (tasksCrud: TasksCrud.Interface) => {
            return async ({ parent, args }: IResolverParams<IListTaskLogParams, ITask>) => {
                const { items } = await tasksCrud.listLogs({
                    sort: ["createdBy_ASC"],
                    limit: 10000,
                    ...args,
                    where: {
                        ...args?.where,
                        task: parent.id
                    }
                });
                return items;
            };
        }
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskLog.task",
        dependencies: [TasksCrud],
        resolver: (tasksCrud: TasksCrud.Interface) => {
            return async ({ parent }: IResolverParams<unknown, ITaskLog>) => {
                return await tasksCrud.getTask(parent.task);
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
        private readonly tasksCrud: TasksCrud.Interface,
        private readonly listModelsUseCase: ListModelsUseCase.Interface,
        private readonly fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface
    ) {}

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

    private async createTypeDefs(): Promise<string> {
        const taskModel = await this.tasksCrud.getTaskModel();
        const logModel = await this.tasksCrud.getLogModel();
        const fieldRegistry = this.fieldRegistry;

        const models = await this.identityContext.withoutAuthorization(async () => {
            const modelsResult = await this.listModelsUseCase.execute({ includePrivate: false });
            return modelsResult.value.filter(model => model.fields.length > 0);
        });

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
        TasksCrud,
        ListModelsUseCase,
        CmsModelFieldToGraphQLRegistry
    ]
});
