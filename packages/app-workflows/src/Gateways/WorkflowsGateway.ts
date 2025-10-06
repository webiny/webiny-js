import type { IWorkflowsGateway } from "./abstraction/index.js";
import type { IWorkflow } from "~/types.js";
import { IWorkflowModel } from "~/Models/index.js";
import ApolloClient from "apollo-client";
import {
    DELETE_WORKFLOW_MUTATION,
    type IStoreWorkflowResponse,
    type IStoreWorkflowVariables,
    LIST_WORKFLOWS_QUERY,
    STORE_WORKFLOW_MUTATION
} from "./graphql.js";
import { WebinyError } from "@webiny/error";
import type {
    IWorkflowsGatewayDeleteWorkflowResponse,
    IWorkflowsGatewayStoreWorkflowResponse
} from "~/Gateways/abstraction/WorkflowsGateway.js";

export interface IWorkflowsGatewayParams {
    app: string;
    client: ApolloClient<object>;
}

export class WorkflowsGateway implements IWorkflowsGateway {
    private readonly app;
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
            console.error(ex);
            return {
                data: null,
                error: WebinyError.from(ex)
            };
        }
    }
    
    public async deleteWorkflow(input: IWorkflowModel): Promise<IWorkflowsGatewayDeleteWorkflowResponse> {
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
            }
        } catch(ex) {
            return {
                data: null,
                error: WebinyError.from(ex)
            }
        }
    }

    public async listWorkflows(): Promise<IWorkflow[]> {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const result = await this.client.query({
            query: LIST_WORKFLOWS_QUERY,
            variables: {
                app: this.app
            },
            fetchPolicy: "no-cache"
        });
        const error = result.data?.workflows?.listWorkflows?.error;
        if (error) {
            throw WebinyError.from(error);
        }
        return result.data?.workflows?.listWorkflows?.data || [];
    }
}
