import ApolloClient from "apollo-client";
import type { IListWorkflowNotificationsResponse } from "./graphql/workflowNotifications.js";
import { LIST_WORKFLOW_NOTIFICATIONS_QUERY } from "./graphql/workflowNotifications.js";
import { WebinyError } from "@webiny/error";
import type {
    IWorkflowNotificationsGateway,
    IWorkflowNotificationsGatewayListResponse
} from "./abstraction/WorkflowNotificationsGateway.js";

export interface IWorkflowNotificationsGatewayParams {
    client: ApolloClient<object>;
}

export class WorkflowNotificationsGateway implements IWorkflowNotificationsGateway {
    readonly #client;

    public constructor(params: IWorkflowNotificationsGatewayParams) {
        this.#client = params.client;
    }

    public async list(): Promise<IWorkflowNotificationsGatewayListResponse> {
        try {
            const result = await this.#client.query<IListWorkflowNotificationsResponse>({
                query: LIST_WORKFLOW_NOTIFICATIONS_QUERY,
                fetchPolicy: "no-cache"
            });
            const error = result.data?.workflows?.listWorkflowNotifications?.error || null;
            const data = result.data?.workflows?.listWorkflowNotifications?.data || null;
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
