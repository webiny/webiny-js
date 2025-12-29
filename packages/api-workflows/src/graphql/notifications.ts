import { GraphQLSchemaPlugin, resolveList } from "@webiny/handler-graphql";
import { ListNotificationTypesUseCase } from "~/features/notifications/ListNotificationTypes/index.js";

export const createNotificationsGraphQL = () => {
    return new GraphQLSchemaPlugin({
        typeDefs: `
            type WorkflowNotificationTypeError {
                message: String!
                code: String
                data: JSON
                stack: String
            }
            
            type WorkflowNotificationType {
                id: String!
                title: String!
            }
            
            type ListWorkflowNotificationTypesResponse {
                data: [WorkflowNotificationType!]
                error: WorkflowNotificationTypeError
            }
            
            extend type WorkflowsQuery {
                listWorkflowNotificationTypes: ListWorkflowNotificationTypesResponse!
            }
        `,
        resolvers: {
            WorkflowsQuery: {
                async listWorkflowNotificationTypes(_, __, context) {
                    return resolveList(async () => {
                        const useCase = context.container.resolve(ListNotificationTypesUseCase);

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
