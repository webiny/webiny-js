import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum";
import { ContextPlugin } from "@webiny/handler";
import { Context, IListTaskParams, ITaskData } from "~/types";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords";
import { CmsModelField } from "@webiny/api-headless-cms/types";
import { emptyResolver, resolve, resolveList } from "./utils";

interface IGetTaskQueryParams {
    id: string;
}

interface ICreateTaskMutationParams {
    task: ITaskData;
}

interface IUpdateTaskMutationParams {
    id: string;
    task: ITaskData;
}

interface IDeleteTaskMutationParams {
    id: string;
}

const removeFieldRequiredValidation = (field: CmsModelField) => {
    if (field.validation) {
        field.validation = field.validation.filter(validation => validation.name !== "required");
    }
    if (field.listValidation) {
        field.listValidation = field.listValidation.filter(v => v.name !== "required");
    }
    return field;
};

const createUpdateFields = (fields: CmsModelField[]): CmsModelField[] => {
    return fields.reduce<CmsModelField[]>((collection, field) => {
        collection.push(removeFieldRequiredValidation({ ...field }));
        return collection;
    }, []);
};

export const createGraphQL = () => {
    return new ContextPlugin<Context>(async context => {
        const model = await context.tasks.getModel();
        const { fields } = model;
        const models = await context.cms.listModels();
        const fieldTypePlugins = createFieldTypePluginRecords(context.plugins);

        const inputCreateFields = renderInputFields({
            models,
            model,
            fields,
            fieldTypePlugins
        });
        const inputUpdateFields = renderInputFields({
            models,
            model,
            fields: createUpdateFields(fields),
            fieldTypePlugins
        });
        const listFilterFieldsRender = renderListFilterFields({
            model,
            fields,
            type: "manage",
            fieldTypePlugins,
            excludeFields: ["entryId", "status"]
        });

        const sortEnumRender = renderSortEnum({
            model,
            fields,
            fieldTypePlugins,
            sorterPlugins: []
        });

        const plugin = new GraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                type WebinyError {
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
                    name: String!
                    input: JSON
                    status: WebinyTaskStatus!
                    startedOn: DateTime
                    finishedOn: DateTime
                    log: JSON
                }

                type WebinyTaskResponse {
                    data: WebinyTask
                    error: WebinyError
                }

                input WebinyTaskListWhereInput {
                    ${listFilterFieldsRender}
                    AND: [WebinyTaskListWhereInput!]
                    OR: [WebinyTaskListWhereInput!]
                }

                enum WebinyTaskListSorter {
                    ${sortEnumRender}
                }

                input WebinyTaskCreateInput {
                    ${inputCreateFields.map(f => f.fields).join("\n")}
                }

                input WebinyTaskUpdateInput {
                    ${inputUpdateFields.map(f => f.fields).join("\n")}
                }

                extend type Query {
                    webinyTasks: WebinyTaskQuery
                }

                extend type Mutation {
                    webinyTasks: WebinyTaskMutation
                }

                extend type WebinyTaskQuery {
                    getTask(id: ID!): WebinyTaskResponse!
                    listTasks(
                        where: WebinyTaskListWhereInput
                        sort: [WebinyTaskListSorter!]
                        limit: Int
                        after: String
                        search: String
                    )
                }

                extend type WebinyTaskMutation {
                    createTask(task: WebinyTaskCreateInput!): WebinyTaskCreateResponse!
                    updateTask(id: ID!, task: WebinyTaskUpdateInput!): WebinyTaskUpdateesponse!
                    deleteTask(id: ID!): WebinyTaskDeleteResponse!
                }
            `,
            resolvers: {
                Query: {
                    webinyTasks: emptyResolver
                },
                Mutation: {
                    webinyTasks: emptyResolver
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
                    }
                },
                WebinyTaskMutation: {
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    // @ts-expect-error
                    createTask: async (_, args: ICreateTaskMutationParams, context: Context) => {
                        return resolve(async () => {
                            return await context.tasks.createTask(args.task);
                        });
                    },
                    /**
                     * We need to think of a way to pass the args type to the resolver without assigning it directly.
                     */
                    // @ts-expect-error
                    updateTask: async (_, args: IUpdateTaskMutationParams, context: Context) => {
                        return resolve(async () => {
                            return await context.tasks.updateTask(args.id, args.task);
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
