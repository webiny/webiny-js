import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum.js";
import { ContextPlugin } from "@webiny/handler";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import type { Context, IListTaskLogParams, IListTaskParams, ITask, ITaskLog } from "~/api/types.js";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields.js";
import { emptyResolver, resolve, resolveList } from "./utils.js";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields.js";
import { checkPermissions } from "./checkPermissions.js";
import type { Plugin } from "@webiny/plugins/types.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { TasksCrud } from "~/api/TasksCrud.js";
import { ListTaskDefinitionsUseCase } from "~/api/features/ListTaskDefinitions/abstractions.js";
import { TriggerTaskUseCase } from "~/api/features/TriggerTask/abstractions.js";
import { AbortTaskUseCase } from "~/api/features/AbortTask/abstractions.js";

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

const createGraphQL = () => {
    const plugin = new ContextPlugin<Context>(async ctx => {
        if (!ctx.container.resolve(TenantContext).getTenant()) {
            return;
        }

        const tasksCrud = ctx.container.resolve(TasksCrud);
        const taskModel = await tasksCrud.getTaskModel();
        const logModel = await tasksCrud.getLogModel();

        const listModels = ctx.container.resolve(ListModelsUseCase);
        const fieldRegistry = ctx.container.resolve(CmsModelFieldToGraphQLRegistry);

        const models = await ctx.container
            .resolve(IdentityContext)
            .withoutAuthorization(async () => {
                const modelsResult = await listModels.execute({ includePrivate: false });

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

        const plugin = new GraphQLSchemaPlugin<Context>({
            typeDefs: /* GraphQL */ `
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
            `,
            resolvers: {
                Query: {
                    backgroundTasks: emptyResolver
                },
                Mutation: {
                    backgroundTasks: emptyResolver
                },
                WebinyBackgroundTaskQuery: {
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    getTask: async (_, args: IGetTaskQueryParams, context) => {
                        return resolve(async () => {
                            await checkPermissions(context, {
                                rwd: "r"
                            });
                            return await context.container.resolve(TasksCrud).getTask(args.id);
                        });
                    },
                    listTasks: async (_, args: IListTaskParams, context) => {
                        return resolveList(async () => {
                            await checkPermissions(context, {
                                rwd: "r"
                            });
                            return await context.container.resolve(TasksCrud).listTasks(args);
                        });
                    },
                    listDefinitions: async (_, __, context) => {
                        return resolve(async () => {
                            await checkPermissions(context, {
                                rwd: "r"
                            });
                            const result = context.container
                                .resolve(ListTaskDefinitionsUseCase)
                                .execute();
                            /**
                             * Do not output private tasks.
                             */
                            return result.filter(item => {
                                return !item.isPrivate;
                            });
                        });
                    },
                    listLogs: async (_, args: IListTaskLogParams, context) => {
                        return resolveList(async () => {
                            await checkPermissions(context, {
                                rwd: "r"
                            });
                            return await context.container.resolve(TasksCrud).listLogs(args);
                        });
                    }
                },
                WebinyBackgroundTaskMutation: {
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    abortTask: async (_, args: IAbortTaskMutationParams, context) => {
                        await checkPermissions(context, {
                            rwd: "w"
                        });
                        return resolve<ITask>(async () => {
                            const result = await context.container
                                .resolve(AbortTaskUseCase)
                                .execute(args);
                            if (result.isOk()) {
                                return result.value;
                            }

                            throw result.error;
                        });
                    },
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    triggerTask: async (_, args: ITriggerTaskMutationParams, context) => {
                        await checkPermissions(context, {
                            rwd: "w"
                        });
                        return resolve<ITask>(async () => {
                            const result = await context.container
                                .resolve(TriggerTaskUseCase)
                                .execute(args);
                            if (result.isOk()) {
                                return result.value;
                            }

                            throw result.error;
                        });
                    },
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    deleteTask: async (_, args: IDeleteTaskMutationParams, context) => {
                        await checkPermissions(context, {
                            rwd: "d"
                        });
                        return resolve(async () => {
                            return await context.container.resolve(TasksCrud).deleteTask(args.id);
                        });
                    }
                },
                /**
                 * Custom resolvers for fields
                 */
                WebinyBackgroundTask: {
                    logs: async (parent: ITask, args: IListTaskLogParams, context) => {
                        const { items } = await context.container.resolve(TasksCrud).listLogs({
                            sort: ["createdBy_ASC"],
                            limit: 10000,
                            ...args,
                            where: {
                                ...args?.where,
                                task: parent.id
                            }
                        });
                        return items;
                    }
                },
                WebinyBackgroundTaskLog: {
                    task: async (parent: ITaskLog, _, context) => {
                        return await context.container.resolve(TasksCrud).getTask(parent.task);
                    }
                }
            }
        });

        plugin.name = "tasks.graphql.schema";

        ctx.plugins.register(plugin);
    });

    plugin.name = "tasks.graphql";

    return plugin;
};

export const createBackgroundTaskGraphQL = (): Plugin[] => {
    return [createGraphQL()];
};
