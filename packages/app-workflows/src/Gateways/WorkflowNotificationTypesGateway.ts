import ApolloClient from "apollo-client";
import type { IListWorkflowNotificationTypesResponse } from "./graphql/workflowNotifications.js";
import { LIST_WORKFLOW_NOTIFICATION_TYPES_QUERY } from "./graphql/workflowNotifications.js";
import { WebinyError } from "@webiny/error";
import type {
    IWorkflowNotificationTypesGateway,
    IWorkflowNotificationTypesGatewayListResponse
} from "./abstraction/WorkflowNotificationTypesGateway.js";

export interface IWorkflowNotificationTypesGatewayParams {
    client: ApolloClient<object>;
}

export class WorkflowNotificationTypesGateway implements IWorkflowNotificationTypesGateway {
    readonly #client;

    public constructor(params: IWorkflowNotificationTypesGatewayParams) {
        this.#client = params.client;
    }

    public async list(): Promise<IWorkflowNotificationTypesGatewayListResponse> {
        try {
            const result = await this.#client.query<IListWorkflowNotificationTypesResponse>({
                query: LIST_WORKFLOW_NOTIFICATION_TYPES_QUERY,
                fetchPolicy: "no-cache"
            });
            const error = result.data?.workflows?.listWorkflowNotificationTypes?.error || null;
            const data = result.data?.workflows?.listWorkflowNotificationTypes?.data || null;
            return {
                data,
                error
            };
        } catch (ex) {
            return {
                data: null,
                error: WebinyError.from(ex)
            };
        }
    }
}
