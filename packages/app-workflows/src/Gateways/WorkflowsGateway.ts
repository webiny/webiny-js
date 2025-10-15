import type {
    IWorkflowsGateway,
    IWorkflowsGatewayDeleteWorkflowResponse,
    IWorkflowsGatewayListWorkflowsResponse,
    IWorkflowsGatewayStoreWorkflowResponse
} from "./abstraction/WorkflowsGateway.js";
import type { IWorkflowModel } from "~/Models/index.js";
import ApolloClient from "apollo-client";
import type {
    IListWorkflowResponse,
    IListWorkflowVariables,
    IStoreWorkflowResponse,
    IStoreWorkflowVariables
} from "./graphql.js";
import {
    DELETE_WORKFLOW_MUTATION,
    LIST_WORKFLOWS_QUERY,
    STORE_WORKFLOW_MUTATION
} from "./graphql.js";
import { WebinyError } from "@webiny/error";
import type { IWorkflowApplication } from "~/types.js";

export interface IWorkflowsGatewayParams {
    app: IWorkflowApplication;
    client: ApolloClient<object>;
}

export class WorkflowsGateway implements IWorkflowsGateway {
    public readonly app;
    private readonly client;

    public constructor(params: IWorkflowsGatewayParams) {
        this.app = params.app;
        this.client = params.client;
    }

    public async storeWorkflow(
        input: IWorkflowModel
    ): Promise<IWorkflowsGatewayStoreWorkflowResponse> {
        const workflow = input.toJS();
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
        input: IWorkflowModel
    ): Promise<IWorkflowsGatewayDeleteWorkflowResponse> {
        const workflow = input.toJS();
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

    public async listWorkflows(): Promise<IWorkflowsGatewayListWorkflowsResponse> {
        try {
            const result = await this.client.query<IListWorkflowResponse, IListWorkflowVariables>({
                query: LIST_WORKFLOWS_QUERY,
                variables: {
                    where: {
                        app: this.app.id
                    },
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
