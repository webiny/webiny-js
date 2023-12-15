import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum";
import { ContextPlugin } from "@webiny/handler";
import { Context, IListTaskParams, ITaskDefinition } from "~/types";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords";
import { emptyResolver, resolve, resolveList } from "./utils";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";

interface IGetTaskQueryParams {
    id: string;
}

interface IStopTaskMutationParams {
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

const createWebinyTaskDefinitionEnum = (definitions: ITaskDefinition[]): string => {
    if (definitions.length === 0) {
        return "Empty";
    }
    return definitions.map(definition => definition.id).join("\n");
};

export const createGraphQL = () => {
    return new ContextPlugin<Context>(async context => {
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
                type WebinyTaskError {
                    message: String
                    code: String
                    data: JSON
                    stack: String
                }

                enum WebinyTaskStatus {
                    pending
                    running
                    failed
                    success
                }

                type WebinyTask {
                    id: String!
                    createdOn: DateTime!
                    savedOn: DateTime
                    createdBy: WebinyTaskIdentity!
                    ${fields.map(f => f.fields).join("\n")}
                }

                type WebinyTaskResponse {
                    data: WebinyTask
                    error: WebinyTaskError
                }

                type WebinyTaskMeta {
                    cursor: String
                    hasMoreItems: Boolean!
                    totalCount: Int!
                }

                type WebinyTaskListResponse {
                    data: [WebinyTask!]
                    meta: WebinyTaskMeta
                    error: WebinyTaskError
                }

                type WebinyTaskDefinition {
                    id: String!
                    title: String!
                    description: String
                    fields: JSON
                }

                type WebinyTaskListDefinitionsResponse {
                    data: [WebinyTaskDefinition!]
                    error: WebinyTaskError
                }
                
                type WebinyTaskIdentity {
                    id: String!
                    displayName: String!
                    type: String
                }
                
                type WebinyTaskTriggerResponse {
                    data: WebinyTask
                    error: WebinyTaskError
                }
                
                type WebinyTaskDeleteResponse {
                    data: Boolean
                    error: WebinyTaskError
                }

                input WebinyTaskListWhereInput {
                    ${listFilterFieldsRender}
                    AND: [WebinyTaskListWhereInput!]
                    OR: [WebinyTaskListWhereInput!]
                }

                enum WebinyTaskListSorter {
                    ${sortEnumRender}
                }
                
                type WebinyTaskQuery {
                    _empty: String
                }
                
                type WebinyTaskMutation {
                    _empty: String
                }
                
                enum WebinyTaskDefinitionEnum {
                    ${createWebinyTaskDefinitionEnum(taskDefinitions)}
                }

                extend type Query {
                    backgroundTasks: WebinyTaskQuery
                }

                extend type Mutation {
                    backgroundTasks: WebinyTaskMutation
                }

                extend type WebinyTaskQuery {
                    getTask(id: ID!): WebinyTaskResponse!
                    listTasks(
                        where: WebinyTaskListWhereInput
                        sort: [WebinyTaskListSorter!]
                        limit: Int
                        after: String
                        search: String
                    ): WebinyTaskListResponse!
                    listDefinitions: WebinyTaskListDefinitionsResponse!
                }

                extend type WebinyTaskMutation {
                    triggerTask(definition: WebinyTaskDefinitionEnum!, values: JSON, name: String): WebinyTaskTriggerResponse!
                    stopTask(id: ID!, message: String): WebinyTaskResponse!
                    deleteTask(id: ID!): WebinyTaskDeleteResponse!
                }
            `,
            resolvers: {
                Query: {
                    backgroundTasks: emptyResolver
                },
                Mutation: {
                    backgroundTasks: emptyResolver
                },
                WebinyTaskQuery: {
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    // @ts-expect-error
                    getTask: async (_, args: IGetTaskQueryParams, context: Context) => {
                        return resolve(async () => {
                            return await context.tasks.getTask(args.id);
                        });
                    },
                    listTasks: async (_, args: IListTaskParams, context: Context) => {
                        return resolveList(async () => {
                            return await context.tasks.listTasks(args);
                        });
                    },
                    listDefinitions: async (_, __, context: Context) => {
                        return resolve(async () => {
                            return context.tasks.listDefinitions();
                        });
                    }
                },
                WebinyTaskMutation: {
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    // @ts-expect-error
                    stopTask: async (_, args: IStopTaskMutationParams, context: Context) => {
                        return resolve(async () => {
                            return await context.tasks.stop(args);
                        });
                    },
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    // @ts-expect-error
                    triggerTask: async (_, args: ITriggerTaskMutationParams, context: Context) => {
                        return resolve(async () => {
                            return await context.tasks.trigger(args);
                        });
                    },
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    // @ts-expect-error
                    deleteTask: async (_, args: IDeleteTaskMutationParams, context: Context) => {
                        return resolve(async () => {
                            return await context.tasks.deleteTask(args.id);
                        });
                    }
                }
            }
        });
        context.plugins.register(plugin);
    });
};
