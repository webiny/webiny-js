import type { Container } from "@webiny/di";
import type { GraphQLSchema } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeResolvers } from "@graphql-tools/merge";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum.js";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields.js";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields.js";
import { createBaseContentSchema } from "@webiny/api-headless-cms/graphql/schema/baseContentSchema.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import type { Context, IListTaskLogParams, IListTaskParams, ITask, ITaskLog } from "~/api/types.js";
import { TasksCrud } from "~/api/TasksCrud.js";
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

/**
 * Builds the background-tasks GraphQL schema after context enhancement — the schema shape depends on
 * the per-tenant CMS task/log content models, so it can only be rendered at request time (once the
 * tenant is known and the CMS facade is resolvable). Replaces the legacy `createBackgroundTaskGraphQL`
 * + `createBackgroundTaskSettingsGraphQL` ContextPlugins; the settings schema is merged in here
 * because it extends the task schema's `WebinyBackgroundTaskQuery`/`Mutation` types.
 */
class BackgroundTasksContextualSchemaImpl implements IGraphQLContextualSchema {
    constructor(
        private tenantCtx: TenantContext.Interface,
        private identityCtx: IdentityContext.Interface
    ) {}

    async build(ctx: Record<string, any>): Promise<GraphQLSchema> {
        if (!this.tenantCtx.getTenant()) {
            return makeExecutableSchema({
                typeDefs: "type Query\ntype Mutation",
                assumeValidSDL: true
            });
        }

        const container = ctx.container as Container;

        const tasksCrud = container.resolve(TasksCrud);
        const taskModel = await tasksCrud.getTaskModel();
        const logModel = await tasksCrud.getLogModel();

        // Resolve the CMS use-cases lazily here (at build/request time) rather than as constructor
        // dependencies — they depend on registrations the CMS initializer only makes during its own
        // build(), so eager injection would fail when the engine constructs all contextual schemas.
        const listModels = container.resolve(ListModelsUseCase);
        const fieldRegistry = container.resolve(CmsModelFieldToGraphQLRegistry);

        const models = await this.identityCtx.withoutAuthorization(async () => {
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

        const typeDefs = /* GraphQL */ `
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

        const resolvers = {
            Query: {
                backgroundTasks: emptyResolver
            },
            Mutation: {
                backgroundTasks: emptyResolver
            },
            WebinyBackgroundTaskQuery: {
                getTask: async (_: unknown, args: IGetTaskQueryParams, context: Context) => {
                    return resolve(async () => {
                        await checkPermissions(context, { rwd: "r" });
                        return await context.container.resolve(TasksCrud).getTask(args.id);
                    });
                },
                listTasks: async (_: unknown, args: IListTaskParams, context: Context) => {
                    return resolveList(async () => {
                        await checkPermissions(context, { rwd: "r" });
                        return await context.container.resolve(TasksCrud).listTasks(args);
                    });
                },
                listDefinitions: async (_: unknown, __: unknown, context: Context) => {
                    return resolve(async () => {
                        await checkPermissions(context, { rwd: "r" });
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
                listLogs: async (_: unknown, args: IListTaskLogParams, context: Context) => {
                    return resolveList(async () => {
                        await checkPermissions(context, { rwd: "r" });
                        return await context.container.resolve(TasksCrud).listLogs(args);
                    });
                },
                getSettings: async (_: unknown, __: unknown, context: Context) => {
                    return resolve(async () => {
                        await checkPermissions(context, { rwd: "r" });
                        const repository = context.container.resolve(
                            GetBackgroundTaskSettingsRepository
                        );
                        const result = await repository.execute();
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                }
            },
            WebinyBackgroundTaskMutation: {
                abortTask: async (_: unknown, args: IAbortTaskMutationParams, context: Context) => {
                    await checkPermissions(context, { rwd: "w" });
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
                triggerTask: async (
                    _: unknown,
                    args: ITriggerTaskMutationParams,
                    context: Context
                ) => {
                    await checkPermissions(context, { rwd: "w" });
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
                deleteTask: async (
                    _: unknown,
                    args: IDeleteTaskMutationParams,
                    context: Context
                ) => {
                    await checkPermissions(context, { rwd: "d" });
                    return resolve(async () => {
                        return await context.container.resolve(TasksCrud).deleteTask(args.id);
                    });
                },
                updateSettings: async (_: unknown, args: IUpdateSettingsArgs, context: Context) => {
                    return resolve(async () => {
                        const useCase = context.container.resolve(
                            UpdateBackgroundTaskSettingsUseCase
                        );
                        const result = await useCase.execute(args.input);
                        if (result.isFail()) {
                            throw result.error;
                        }
                        return result.value;
                    });
                }
            },
            /**
             * Custom resolvers for fields
             */
            WebinyBackgroundTask: {
                logs: async (parent: ITask, args: IListTaskLogParams, context: Context) => {
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
                task: async (parent: ITaskLog, _: unknown, context: Context) => {
                    return await context.container.resolve(TasksCrud).getTask(parent.task);
                }
            }
        };

        // The generated task/log model schema references CMS base scalars (DateTime, JSON, Number,
        // ...). Include createBaseContentSchema() — which declares those scalars, their resolvers, and
        // the base Query/Mutation types — so this standalone schema is self-contained and valid before
        // the engine merges it with the composed static schema.
        const baseContent = createBaseContentSchema();

        return makeExecutableSchema({
            typeDefs: [baseContent.schema.typeDefs as string, typeDefs],
            resolvers: mergeResolvers([baseContent.schema.resolvers as any, resolvers as any]),
            inheritResolversFromInterfaces: true
        });
    }
}

export const BackgroundTasksContextualSchema = GraphQLContextualSchema.createImplementation({
    implementation: BackgroundTasksContextualSchemaImpl,
    dependencies: [TenantContext, IdentityContext]
});
