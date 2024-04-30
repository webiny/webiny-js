import { CmsGraphQLSchemaPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { ContextPlugin } from "@webiny/handler-aws";
import { EntriesTask, HcmsTasksContext } from "~/types";
import { Response } from "@webiny/handler-graphql";

export const createGraphQL = () => {
    return new ContextPlugin<HcmsTasksContext>(async context => {
        if (!(await isHeadlessCmsReady(context))) {
            return;
        }

        const trashBinPlugin = new CmsGraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                type EmptyTrashBinResponseData {
                    id: String
                }

                type EmptyTrashBinResponse {
                    data: EmptyTrashBinResponseData
                    error: CmsError
                }

                extend type Mutation {
                    emptyTrashBin(modelId: String!): EmptyTrashBinResponse
                }
            `,
            resolvers: {
                Mutation: {
                    emptyTrashBin: async (_, args) => {
                        const response = await context.tasks.trigger({
                            definition: EntriesTask.DeleteEntriesByModel,
                            input: {
                                modelId: args.modelId
                            }
                        });

                        return new Response({
                            id: response.id
                        });
                    }
                }
            }
        });

        trashBinPlugin.name = "headless-cms.graphql.schema.trashBin";

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
    
                    type ${model.singularApiName}BulkActionResponse {
                        data: ${model.singularApiName}BulkActionResponseData
                        error: CmsError
                    }
                
                    extend type Mutation {
                        bulk${model.singularApiName}Action(
                            action: String!
                            where: ${model.singularApiName}ListWhereInput
                        ): ${model.singularApiName}BulkActionResponse
                    }
                `,
                resolvers: {
                    Mutation: {
                        [`bulk${model.singularApiName}Action`]: async (_, args) => {
                            const identity = context.security.getIdentity();
                            const response = await context.tasks.trigger({
                                definition: args.action,
                                input: {
                                    modelId: model.modelId,
                                    where: args.where,
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

        context.plugins.register([trashBinPlugin, ...bulkActionPlugins]);
    });
};
