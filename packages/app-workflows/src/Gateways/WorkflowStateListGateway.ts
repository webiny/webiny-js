import type {
    IWorkflowStateListGateway,
    IWorkflowStateListGatewayListParams,
    IWorkflowStateListGatewayListResponse
} from "./abstraction/WorkflowStateListGateway.js";
import type ApolloClient from "apollo-client";
import type {
    IListWorkflowStatesResponse,
    IListWorkflowStatesVariables
} from "~/Gateways/graphql/workflowStates.js";
import {
    LIST_OWN_WORKFLOW_STATES_QUERY,
    LIST_REQUESTED_WORKFLOW_STATES_QUERY,
    LIST_WORKFLOW_STATES_QUERY
} from "~/Gateways/graphql/workflowStates.js";
import { WebinyError } from "@webiny/error";

interface IWorkflowStateListGatewayParams {
    client: ApolloClient<object>;
}

export class WorkflowStateListGateway implements IWorkflowStateListGateway {
    #client;

    public constructor(params: IWorkflowStateListGatewayParams) {
        this.#client = params.client;
    }

    public async list(
        params: IWorkflowStateListGatewayListParams
    ): Promise<IWorkflowStateListGatewayListResponse> {
        try {
            const result = await this.#client.query<
                IListWorkflowStatesResponse,
                IListWorkflowStatesVariables
            >({
                query: LIST_WORKFLOW_STATES_QUERY,
                variables: {
                    sort: ["createdOn_DESC"],
                    ...params
                },
                fetchPolicy: "no-cache"
            });
            const error = result.data?.workflows?.listWorkflowStates?.error || null;
            const meta = result.data?.workflows?.listWorkflowStates?.meta || null;
            const data = result.data?.workflows?.listWorkflowStates?.data || null;
            return {
                data,
                meta,
                error
            };
        } catch (ex) {
            return {
                data: null,
                meta: null,
                error: WebinyError.from(ex)
            };
        }
    }

    public async listOwn(
        params: IWorkflowStateListGatewayListParams
    ): Promise<IWorkflowStateListGatewayListResponse> {
        try {
            const result = await this.#client.query<
                IListWorkflowStatesResponse,
                IListWorkflowStatesVariables
            >({
                query: LIST_OWN_WORKFLOW_STATES_QUERY,
                variables: {
                    sort: ["createdOn_DESC"],
                    ...params
                },
                fetchPolicy: "no-cache"
            });
            const error = result.data?.workflows?.listWorkflowStates?.error || null;
            const meta = result.data?.workflows?.listWorkflowStates?.meta || null;
            const data = result.data?.workflows?.listWorkflowStates?.data || null;
            return {
                data,
                meta,
                error
            };
        } catch (ex) {
            return {
                data: null,
                meta: null,
                error: WebinyError.from(ex)
            };
        }
    }

    public async listRequested(
        params: IWorkflowStateListGatewayListParams
    ): Promise<IWorkflowStateListGatewayListResponse> {
        try {
            const result = await this.#client.query<
                IListWorkflowStatesResponse,
                IListWorkflowStatesVariables
            >({
                query: LIST_REQUESTED_WORKFLOW_STATES_QUERY,
                variables: {
                    sort: ["createdOn_DESC"],
                    ...params
                },
                fetchPolicy: "no-cache"
            });
            const error = result.data?.workflows?.listWorkflowStates?.error || null;
            const meta = result.data?.workflows?.listWorkflowStates?.meta || null;
            const data = result.data?.workflows?.listWorkflowStates?.data || null;
            return {
                data,
                meta,
                error
            };
        } catch (ex) {
            return {
                data: null,
                meta: null,
                error: WebinyError.from(ex)
            };
        }
    }
}
