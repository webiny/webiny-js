import { CmsGraphQLSchemaPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { ContextPlugin } from "@webiny/handler-aws";
import { EntriesTask, HcmsTasksContext } from "~/types";
import { Response } from "@webiny/handler-graphql";

export const createGraphQL = () => {
    return new ContextPlugin<HcmsTasksContext>(async context => {
        if (!(await isHeadlessCmsReady(context))) {
            return;
        }

        const models = await context.security.withoutAuthorization(async () => {
            return (await context.cms.listModels()).filter(model => !model.isPrivate);
        });

        const genericTypePlugin = new CmsGraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                type EmptyTrashBinResponseData {
                    id: String
                }

                type EmptyTrashBinResponse {
                    data: EmptyTrashBinResponseData
                    error: CmsError
                }
            `
        });

        genericTypePlugin.name = "headless-cms.graphql.schema.trashBin.types";

        const modelsPlugins: CmsGraphQLSchemaPlugin<HcmsTasksContext>[] = [];

        models.forEach(model => {
            const plugin = new CmsGraphQLSchemaPlugin({
                typeDefs: /* GraphQL */ `
                        type ${model.singularApiName}EmptyTrashBinResponseData {
                            id: String
                        }
                
                        type ${model.singularApiName}EmptyTrashBinResponse {
                            data: ${model.singularApiName}EmptyTrashBinResponseData
                            error: CmsError
                        }
                        
                        extend type Mutation {
                            empty${model.singularApiName}TrashBin: EmptyTrashBinResponse
                        }
                    `,
                resolvers: {
                    Mutation: {
                        [`empty${model.singularApiName}TrashBin`]: async () => {
                            // Implement the logic for emptying the recycle bin.
                            const response = await context.tasks.trigger({
                                definition: EntriesTask.EmptyTrashBinByModel,
                                input: {
                                    modelId: model.modelId
                                }
                            });

                            return new Response({
                                id: response.id
                            });
                        }
                    }
                }
            });

            plugin.name = `headless-cms.graphql.schema.trashBin.${model.modelId}`;
            modelsPlugins.push(plugin);
        });

        context.plugins.register([genericTypePlugin, ...modelsPlugins]);
    });
};
