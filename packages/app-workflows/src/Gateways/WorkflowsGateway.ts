import type {
    IWorkflowsGateway,
    IWorkflowsGatewayDeleteWorkflowResponse,
    IWorkflowsGatewayListParams,
    IWorkflowsGatewayListWorkflowsResponse,
    IWorkflowsGatewayStoreWorkflowResponse
} from "./abstraction/WorkflowsGateway.js";
import ApolloClient from "apollo-client";
import type {
    IListWorkflowResponse,
    IListWorkflowVariables,
    IStoreWorkflowResponse,
    IStoreWorkflowVariables
} from "./graphql/workflows.js";
import {
    DELETE_WORKFLOW_MUTATION,
    LIST_WORKFLOWS_QUERY,
    STORE_WORKFLOW_MUTATION
} from "./graphql/workflows.js";
import { WebinyError } from "@webiny/error";
import { IWorkflow } from "~/types.js";

export interface IWorkflowsGatewayParams {
    // app: IWorkflowApplication;
    client: ApolloClient<object>;
}

export class WorkflowsGateway implements IWorkflowsGateway {
    private readonly client;

    public constructor(params: IWorkflowsGatewayParams) {
        this.client = params.client;
    }

    public async storeWorkflow(
        workflow: IWorkflow
    ): Promise<IWorkflowsGatewayStoreWorkflowResponse> {
        try {
            const result = await this.client.mutate<
                IStoreWorkflowResponse,
                IStoreWorkflowVariables
            >({
                mutation: STORE_WORKFLOW_MUTATION,
                variables: {
                    app: workflow.app,
                    id: workflow.id,
                    data: {
                        name: workflow.name,
                        steps: workflow.steps
                    }
                }
            });
            return {
                data: result.data?.workflows.storeWorkflow.data || null,
                error: result.data?.workflows.storeWorkflow.error || null
            };
        } catch (ex) {
            return {
                data: null,
                error: WebinyError.from(ex)
            };
        }
    }

    public async deleteWorkflow(
        workflow: IWorkflow
    ): Promise<IWorkflowsGatewayDeleteWorkflowResponse> {
        try {
            const result = await this.client.mutate({
                mutation: DELETE_WORKFLOW_MUTATION,
                variables: {
                    app: workflow.app,
                    id: workflow.id
                }
            });
            return {
                data: result.data?.workflows.deleteWorkflow.data || null,
                error: result.data?.workflows.deleteWorkflow.error || null
            };
        } catch (ex) {
            return {
                data: null,
                error: WebinyError.from(ex)
            };
        }
    }

    public async listWorkflows(
        params?: IWorkflowsGatewayListParams
    ): Promise<IWorkflowsGatewayListWorkflowsResponse> {
        try {
            const result = await this.client.query<IListWorkflowResponse, IListWorkflowVariables>({
                query: LIST_WORKFLOWS_QUERY,
                variables: {
                    ...params,
                    sort: ["createdOn_DESC"]
                },
                fetchPolicy: "no-cache"
            });
            const error = result.data?.workflows?.listWorkflows?.error || null;
            const data = result.data?.workflows?.listWorkflows?.data || null;
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
