import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum";
import { ContextPlugin } from "@webiny/handler";
import { Context, IListTaskParams, ITaskDefinition } from "~/types";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords";
import { emptyResolver, resolve, resolveList } from "./utils";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";
import { checkPermissions } from "./checkPermissions";

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
    values?: any;
}

interface IDeleteTaskMutationParams {
    id: string;
}

const createWebinyBackgroundTaskDefinitionEnum = (definitions: ITaskDefinition[]): string => {
    if (definitions.length === 0) {
        return "Empty";
    }
    return definitions.map(definition => definition.id).join("\n");
};

export const createGraphQL = () => {
    const plugin = new ContextPlugin<Context>(async context => {
        if (!context.tenancy.getCurrentTenant()) {
            return;
        } else if (!context.i18n.getDefaultLocale()) {
            return;
        }

        const model = await context.tasks.getModel();

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

        const fields = renderFields({
            models,
            model,
            fields: model.fields,
            type: "manage",
            fieldTypePlugins
        });

        const listFilterFieldsRender = renderListFilterFields({
            model,
            fields: model.fields,
            type: "manage",
            fieldTypePlugins,
            excludeFields: ["entryId", "status"]
        });

        const sortEnumRender = renderSortEnum({
            model,
            fields: model.fields,
            fieldTypePlugins,
            sorterPlugins: []
        });

        const taskDefinitions = context.tasks.listDefinitions();

        const plugin = new GraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                type WebinyBackgroundTaskError {
                    message: String
                    code: String
                    data: JSON
                    stack: String
                }

                type WebinyBackgroundTask {
                    id: String!
                    createdOn: DateTime!
                    savedOn: DateTime
                    createdBy: WebinyBackgroundTaskIdentity!
                    ${fields.map(f => f.fields).join("\n")}
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
                    ${listFilterFieldsRender}
                    AND: [WebinyBackgroundTaskListWhereInput!]
                    OR: [WebinyBackgroundTaskListWhereInput!]
                }

                enum WebinyBackgroundTaskListSorter {
                    ${sortEnumRender}
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
                }

                extend type WebinyBackgroundTaskMutation {
                    triggerTask(definition: WebinyBackgroundTaskDefinitionEnum!, values: JSON, name: String): WebinyBackgroundTaskTriggerResponse!
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
                    getTask: async (_, args: IGetTaskQueryParams, context: Context) => {
                        return resolve(async () => {
                            await checkPermissions(context, {
                                rwd: "r"
                            });
                            return await context.tasks.getTask(args.id);
                        });
                    },
                    listTasks: async (_, args: IListTaskParams, context: Context) => {
                        return resolveList(async () => {
                            await checkPermissions(context, {
                                rwd: "r"
                            });
                            return await context.tasks.listTasks(args);
                        });
                    },
                    listDefinitions: async (_, __, context: Context) => {
                        return resolve(async () => {
                            await checkPermissions(context, {
                                rwd: "r"
                            });
                            return context.tasks.listDefinitions();
                        });
                    }
                },
                WebinyBackgroundTaskMutation: {
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    // @ts-expect-error
                    abortTask: async (_, args: IAbortTaskMutationParams, context: Context) => {
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
                    triggerTask: async (_, args: ITriggerTaskMutationParams, context: Context) => {
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
                    deleteTask: async (_, args: IDeleteTaskMutationParams, context: Context) => {
                        await checkPermissions(context, {
                            rwd: "d"
                        });
                        return resolve(async () => {
                            return await context.tasks.deleteTask(args.id);
                        });
                    }
                }
            }
        });
        context.plugins.register(plugin);
    });

    plugin.name = "tasks.graphql";

    return plugin;
};
