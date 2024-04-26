import { CmsGraphQLSchemaPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { ContextPlugin } from "@webiny/handler-aws";
import { EntriesTask, HcmsTasksContext } from "~/types";
import { Response } from "@webiny/handler-graphql";

export const createGraphQL = () => {
    return new ContextPlugin<HcmsTasksContext>(async context => {
        if (!(await isHeadlessCmsReady(context))) {
            return;
        }

        const plugin = new CmsGraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                type EmptyTrashBinResponseData {
                    id: String
                }

                type EmptyTrashBinResponse {
                    data: EmptyTrashBinResponseData
                    error: CmsError
                }

                type BulkActionResponseData {
                    id: String
                }

                type BulkActionResponse {
                    data: EmptyTrashBinResponseData
                    error: CmsError
                }

                input BulkActionWhereInput {
                    entryId_in: [String!]
                    wbyAco_location: WbyAcoLocationWhereInput
                }

                extend type Mutation {
                    emptyTrashBin(modelId: String!): EmptyTrashBinResponse
                    bulkPublishEntries(
                        modelId: String!
                        where: BulkActionWhereInput
                    ): BulkActionResponse
                }
            `,
            resolvers: {
                Mutation: {
                    emptyTrashBin: async (_, args) => {
                        const response = await context.tasks.trigger({
                            definition: EntriesTask.EmptyTrashBinByModel,
                            input: {
                                modelId: args.modelId
                            }
                        });

                        return new Response({
                            id: response.id
                        });
                    },
                    bulkPublishEntries: async (_, args) => {
                        const identity = context.security.getIdentity();
                        const response = await context.tasks.trigger({
                            definition: EntriesTask.PublishEntriesByModel,
                            input: {
                                modelId: args.modelId,
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

        plugin.name = "headless-cms.graphql.schema.trashBin.types";

        context.plugins.register([plugin]);
    });
};
