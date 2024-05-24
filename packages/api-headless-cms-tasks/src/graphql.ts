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

        const models = await context.security.withoutAuthorization(async () => {
            return (await context.cms.listModels()).filter(model => !model.isPrivate);
        });

        const bulkActionPlugins: CmsGraphQLSchemaPlugin<HcmsTasksContext>[] = [];

        models.forEach(model => {
            const plugin = new CmsGraphQLSchemaPlugin({
                typeDefs: /* GraphQL */ `
                    type ${model.singularApiName}BulkActionResponseData {
                        id: String
                    }
                    
                    enum ${model.singularApiName}BulkActionName {
                        ${BulkActionNames}
                    }
    
                    type ${model.singularApiName}BulkActionResponse {
                        data: ${model.singularApiName}BulkActionResponseData
                        error: CmsError
                    }
                
                    extend type Mutation {
                        bulkAction${model.singularApiName}(
                            action: ${model.singularApiName}BulkActionName!
                            where: ${model.singularApiName}ListWhereInput
                            data: JSON
                        ): ${model.singularApiName}BulkActionResponse
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
            bulkActionPlugins.push(plugin);
        });

        context.plugins.register(bulkActionPlugins);
    });
};
