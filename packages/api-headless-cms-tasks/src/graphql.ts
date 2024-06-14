import { CmsGraphQLSchemaPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { ContextPlugin } from "@webiny/handler-aws";
import { EntriesTask, HcmsTasksContext } from "~/types";
import { ErrorResponse, Response } from "@webiny/handler-graphql";

const BulkActions = new Map([
    ["DeleteEntries", EntriesTask.DeleteEntriesByModel],
    ["PublishEntries", EntriesTask.PublishEntriesByModel],
    ["UnpublishEntries", EntriesTask.UnpublishEntriesByModel],
    ["MoveEntriesToFolder", EntriesTask.MoveEntriesToFolderByModel],
    ["MoveEntriesToTrash", EntriesTask.MoveEntriesToTrashByModel],
    ["RestoreEntriesFromTrash", EntriesTask.RestoreEntriesFromTrashByModel]
]);

const BulkActionNames = Array.from(BulkActions.keys()).join("\n");

export const createGraphQL = () => {
    return new ContextPlugin<HcmsTasksContext>(async context => {
        if (!(await isHeadlessCmsReady(context))) {
            return;
        }

        const genericBulkActionPlugin = new CmsGraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                enum BulkActionName {
                    ${BulkActionNames}
                }
                 
                type BulkActionResponseData {
                    id: String
                }
                 
                type BulkActionResponse {
                    data: BulkActionResponseData
                    error: CmsError
                }
            `
        });

        genericBulkActionPlugin.name = `headless-cms.graphql.schema.bulkAction`;

        const models = await context.security.withoutAuthorization(async () => {
            return (await context.cms.listModels()).filter(model => !model.isPrivate);
        });

        const modelBulkActionPlugins: CmsGraphQLSchemaPlugin<HcmsTasksContext>[] = [];

        models.forEach(model => {
            const plugin = new CmsGraphQLSchemaPlugin({
                typeDefs: /* GraphQL */ `
                    extend type Mutation {
                        bulkAction${model.singularApiName}(
                            action: BulkActionName!
                            where: ${model.singularApiName}ListWhereInput
                            search: String
                            data: JSON
                        ): BulkActionResponse
                    }
                `,
                resolvers: {
                    Mutation: {
                        [`bulkAction${model.singularApiName}`]: async (_, args) => {
                            const identity = context.security.getIdentity();
                            const definition = BulkActions.get(args.action);

                            if (!definition) {
                                return new ErrorResponse({
                                    message: "No bulk action defined for the provided action.",
                                    code: "BULK_ACTION_ACTION_ERROR",
                                    data: {
                                        ...args,
                                        identity
                                    }
                                });
                            }

                            const response = await context.tasks.trigger({
                                definition,
                                input: {
                                    modelId: model.modelId,
                                    where: args.where,
                                    search: args.search,
                                    data: args.data,
                                    identity
                                }
                            });

                            return new Response({
                                id: response.id
                            });
                        }
                    }
                }
            });

            plugin.name = `headless-cms.graphql.schema.bulkAction.${model.modelId}`;
            modelBulkActionPlugins.push(plugin);
        });

        context.plugins.register([genericBulkActionPlugin, ...modelBulkActionPlugins]);
    });
};
