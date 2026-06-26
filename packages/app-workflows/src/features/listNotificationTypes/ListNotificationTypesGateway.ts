import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/features/graphqlFields.js";
import { ListNotificationTypesGateway as GatewayAbstraction } from "./abstractions.js";
import type { IWorkflowNotificationType } from "~/types.js";

interface ListNotificationTypesResponse {
    workflows: {
        listWorkflowNotificationTypes: {
            data: IWorkflowNotificationType[] | null;
            error: { message: string } | null;
        };
    };
}

const LIST_NOTIFICATION_TYPES_QUERY = /* GraphQL */ `
    query ListWorkflowNotificationTypes {
        workflows {
            listWorkflowNotificationTypes {
                data {
                    id
                    title
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

class ListNotificationTypesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<IWorkflowNotificationType[]> {
        const response = await this.client.execute<ListNotificationTypesResponse>({
            query: LIST_NOTIFICATION_TYPES_QUERY
        });

        const { data, error } = response.workflows.listWorkflowNotificationTypes;

        if (error) {
            throw new Error(error.message);
        }

        return data || [];
    }
}

export const ListNotificationTypesGateway = GatewayAbstraction.createImplementation({
    implementation: ListNotificationTypesGatewayImpl,
    dependencies: [MainGraphQLClient]
});
