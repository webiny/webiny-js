import { resolveList } from "@webiny/api-graphql";
import type { IGraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { ListNotificationTypesUseCase } from "~/features/notifications/ListNotificationTypes/index.js";

export const addNotificationsSchema = (builder: IGraphQLSchemaBuilder): void => {
    builder.addTypeDefs(`
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
    `);

    builder.addResolver({
        path: "WorkflowsQuery.listWorkflowNotificationTypes",
        dependencies: [ListNotificationTypesUseCase],
        resolver(listNotificationTypes) {
            return () =>
                resolveList(async () => {
                    const results = await listNotificationTypes.execute();

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
    });
};
