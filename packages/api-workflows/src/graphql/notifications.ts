import { GraphQLSchemaPlugin, resolveList } from "@webiny/handler-graphql";
import { ListNotificationsUseCase } from "~/features/notifications/ListNotifications/index.js";

export const createNotificationsGraphQL = () => {
    return new GraphQLSchemaPlugin({
        typeDefs: `
            type WorkflowNotificationError {
                message: String!
                code: String
                data: JSON
                stack: String
            }
            
            type WorkflowNotificationItem {
                id: String!
                title: String!
            }
            
            type ListWorkflowNotificationsResponse {
                data: [WorkflowNotificationItem!]
                error: WorkflowNotificationError
            }
            
            extend type WorkflowsQuery {
                listWorkflowNotifications: ListWorkflowNotificationsResponse!
            }
        `,
        resolvers: {
            WorkflowsQuery: {
                async listWorkflowNotifications(_, __, context) {
                    return resolveList(async () => {
                        const useCase = context.container.resolve(ListNotificationsUseCase);

                        const results = await useCase.execute();

                        if (results.isFail()) {
                            throw results.error;
                        }
                        return {
                            items: results.value,
                            meta: {
                                totalCount: results.value.length,
                                cursor: null,
                                hasMoreItems: false
                            }
                        };
                    });
                }
            }
        }
    });
};
