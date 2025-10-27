import type ApolloClient from "apollo-client";
import type {
    IWorkflowStatesWidgetGateway,
    IWorkflowStatesWidgetGatewayListOwnStatesParams,
    IWorkflowStatesWidgetGatewayListOwnStatesResponse,
    IWorkflowStatesWidgetGatewayListRequestedStatesParams,
    IWorkflowStatesWidgetGatewayListRequestedStatesResponse
} from "./abstraction/WorkflowStatesWidgetGateway.js";
import type {
    IListOwnWorkflowStatesResponse,
    IListOwnWorkflowStatesVariables,
    IListRequestedWorkflowStatesResponse,
    IListRequestedWorkflowStatesVariables
} from "~/Gateways/graphql/workflowStatesWidget.js";
import {
    LIST_OWN_WORKFLOW_STATES,
    LIST_REQUESTED_WORKFLOW_STATES
} from "~/Gateways/graphql/workflowStatesWidget.js";

interface IWorkflowStatesWidgetGatewayParams {
    client: ApolloClient<object>;
}

export class WorkflowStatesWidgetGateway implements IWorkflowStatesWidgetGateway {
    readonly #client;

    public constructor(params: IWorkflowStatesWidgetGatewayParams) {
        this.#client = params.client;
    }

    public async listOwnStates(
        params: IWorkflowStatesWidgetGatewayListOwnStatesParams
    ): Promise<IWorkflowStatesWidgetGatewayListOwnStatesResponse> {
        try {
            const result = await this.#client.query<
                IListOwnWorkflowStatesResponse,
                IListOwnWorkflowStatesVariables
            >({
                query: LIST_OWN_WORKFLOW_STATES,
                variables: {
                    ...params
                },
                fetchPolicy: "no-cache"
            });
            return {
                data: result.data.data.listOwnWorkflowStates.data,
                meta: result.data.data.listOwnWorkflowStates.meta,
                error: result.data.data.listOwnWorkflowStates.error
            };
        } catch (ex) {
            return {
                data: null,
                meta: null,
                error: ex
            };
        }
    }

    public async listRequestedStates(
        params: IWorkflowStatesWidgetGatewayListRequestedStatesParams
    ): Promise<IWorkflowStatesWidgetGatewayListRequestedStatesResponse> {
        try {
            const result = await this.#client.query<
                IListRequestedWorkflowStatesResponse,
                IListRequestedWorkflowStatesVariables
            >({
                query: LIST_REQUESTED_WORKFLOW_STATES,
                variables: {
                    ...params
                },
                fetchPolicy: "no-cache"
            });
            return {
                data: result.data.data.listRequestedWorkflowStates.data,
                meta: result.data.data.listRequestedWorkflowStates.meta,
                error: result.data.data.listRequestedWorkflowStates.error
            };
        } catch (ex) {
            return {
                data: null,
                meta: null,
                error: ex
            };
        }
    }
}
