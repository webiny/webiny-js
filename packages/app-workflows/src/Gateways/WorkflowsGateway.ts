import type { IWorkflowsGateway } from "./abstraction/index.js";
import type { IWorkflow } from "~/types.js";
import { IWorkflowModel } from "~/Models/index.js";
import ApolloClient from "apollo-client";
import {
    type IStoreWorkflowResponse,
    type IStoreWorkflowVariables,
    LIST_WORKFLOWS_QUERY,
    STORE_WORKFLOW_MUTATION
} from "./graphql.js";
import { WebinyError } from "@webiny/error";

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

    // TODO there will only be one workflow, for now, but later we will have more.
    // Leave the loop, as it is easiest to do atm - later implement proper store workflows.
    public async storeWorkflows(input: IWorkflowModel[]): Promise<void> {
        for (const w of input) {
            const workflow = w.toJS();
            try {
                await this.client.mutate<IStoreWorkflowResponse, IStoreWorkflowVariables>({
                    mutation: STORE_WORKFLOW_MUTATION,
                    variables: {
                        app: workflow.app,
                        id: workflow.id,
                        data: workflow
                    }
                });
            } catch (ex) {
                console.error(ex);
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
