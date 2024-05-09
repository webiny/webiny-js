import { CmsGraphQLSchemaPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { ContextPlugin } from "@webiny/handler-aws";
import { EntriesTask, HcmsTasksContext } from "~/types";
import { Response } from "@webiny/handler-graphql";

export const EntriesTaskActionName = Object.values(EntriesTask).join("\n");

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
                    
                    enum ${model.singularApiName}BulkActionActionName {
                        ${EntriesTaskActionName}
                    }
    
                    type ${model.singularApiName}BulkActionResponse {
                        data: ${model.singularApiName}BulkActionResponseData
                        error: CmsError
                    }
                
                    extend type Mutation {
                        bulkAction${model.singularApiName}(
                            action: ${model.singularApiName}BulkActionActionName!
                            where: ${model.singularApiName}ListWhereInput
                        ): ${model.singularApiName}BulkActionResponse
                    }
                `,
                resolvers: {
                    Mutation: {
                        [`bulkAction${model.singularApiName}`]: async (_, args) => {
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

        context.plugins.register(bulkActionPlugins);
    });
};
