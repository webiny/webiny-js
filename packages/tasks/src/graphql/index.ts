import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum";
import { ContextPlugin } from "@webiny/handler";
import {
    Context,
    IListTaskLogParams,
    IListTaskParams,
    ITask,
    ITaskDefinition,
    ITaskLog
} from "~/types";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords";
import { emptyResolver, resolve, resolveList } from "./utils";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";
import { checkPermissions } from "./checkPermissions";
import { Plugin } from "@webiny/plugins/types";

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

const createWebinyBackgroundTaskDefinitionEnum = (items: ITaskDefinition[]): string => {
    if (items.length === 0) {
        return "Empty";
    }
    return items
        .filter(item => {
            return !item.isPrivate;
        })
        .map(definition => definition.id)
        .join("\n");
};

const createGraphQL = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        if (!context.tenancy.getCurrentTenant()) {
            return;
        } else if (!context.i18n.getDefaultLocale()) {
            return;
        }

        const taskModel = await context.tasks.getTaskModel();
        const logModel = await context.tasks.getLogModel();

        const models = await context.security.withoutAuthorization(async () => {
            return (await context.cms.listModels()).filter(model => {
                if (model.fields.length === 0) {
                    return false;
                } else if (model.isPrivate) {
                    return false;
                }
                return true;
            });
        });
        const fieldTypePlugins = createFieldTypePluginRecords(context.plugins);

        const taskFields = renderFields({
            models,
            model: taskModel,
            fields: taskModel.fields,
            type: "manage",
            fieldTypePlugins
        });

        const logFields = renderFields({
            models,
            model: logModel,
            fields: logModel.fields.filter(field => field.fieldId !== "task"),
            type: "manage",
            fieldTypePlugins
        });

        const listTasksFilterFieldsRender = renderListFilterFields({
            model: taskModel,
            fields: taskModel.fields,
            type: "manage",
            fieldTypePlugins,
            excludeFields: ["entryId"]
        });

        const listLogsFilterFieldsRender = renderListFilterFields({
            model: logModel,
            fields: logModel.fields,
            type: "manage",
            fieldTypePlugins,
            excludeFields: ["entryId"]
        });

        const sortTasksEnumRender = renderSortEnum({
            model: taskModel,
            fields: taskModel.fields,
            fieldTypePlugins,
            sorterPlugins: []
        });

        const sortLogsEnumRender = renderSortEnum({
            model: logModel,
            fields: logModel.fields,
            fieldTypePlugins,
            sorterPlugins: []
        });

        const taskDefinitions = context.tasks.listDefinitions();

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
                    fields: JSON
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
                    ${listTasksFilterFieldsRender}
                }
                
                input WebinyBackgroundTaskLogListWhereInput {
                    ${listLogsFilterFieldsRender}
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

                enum WebinyBackgroundTaskDefinitionEnum {
                    ${createWebinyBackgroundTaskDefinitionEnum(taskDefinitions)}
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
                    triggerTask(definition: WebinyBackgroundTaskDefinitionEnum!, input: JSON, name: String, delay: Number): WebinyBackgroundTaskTriggerResponse!
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
                    // @ts-expect-error
                    getTask: async (_, args: IGetTaskQueryParams, context) => {
                        return resolve(async () => {
                            await checkPermissions(context, {
                                rwd: "r"
                            });
                            return await context.tasks.getTask(args.id);
                        });
                    },
                    listTasks: async (_, args: IListTaskParams, context) => {
                        return resolveList(async () => {
                            await checkPermissions(context, {
                                rwd: "r"
                            });
                            return await context.tasks.listTasks(args);
                        });
                    },
                    listDefinitions: async (_, __, context) => {
                        return resolve(async () => {
                            await checkPermissions(context, {
                                rwd: "r"
                            });
                            const result = context.tasks.listDefinitions();
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
                            return await context.tasks.listLogs(args);
                        });
                    }
                },
                WebinyBackgroundTaskMutation: {
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    // @ts-expect-error
                    abortTask: async (_, args: IAbortTaskMutationParams, context) => {
                        await checkPermissions(context, {
                            rwd: "w"
                        });
                        return resolve(async () => {
                            return await context.tasks.abort(args);
                        });
                    },
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    // @ts-expect-error
                    triggerTask: async (_, args: ITriggerTaskMutationParams, context) => {
                        await checkPermissions(context, {
                            rwd: "w"
                        });
                        return resolve(async () => {
                            return await context.tasks.trigger(args);
                        });
                    },
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    // @ts-expect-error
                    deleteTask: async (_, args: IDeleteTaskMutationParams, context) => {
                        await checkPermissions(context, {
                            rwd: "d"
                        });
                        return resolve(async () => {
                            return await context.tasks.deleteTask(args.id);
                        });
                    }
                },
                /**
                 * Custom resolvers for fields
                 */
                WebinyBackgroundTask: {
                    logs: async (parent: ITask, args: IListTaskLogParams, context) => {
                        const { items } = await context.tasks.listLogs({
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
                        return await context.tasks.getTask(parent.task);
                    }
                }
            }
        });
        context.plugins.register(plugin);
    });

    plugin.name = "tasks.graphql";

    return plugin;
};

export const createBackgroundTaskGraphQL = (): Plugin[] => {
    return [createGraphQL()];
};
