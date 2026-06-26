import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WORKFLOW_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import { StoreWorkflowGateway as GatewayAbstraction } from "./abstractions.js";
import type { IWorkflow } from "~/types.js";

interface StoreWorkflowResponse {
    workflows: {
        storeWorkflow: {
            data: IWorkflow | null;
            error: { message: string } | null;
        };
    };
}

const STORE_WORKFLOW_MUTATION = /* GraphQL */ `
    mutation StoreWorkflow($app: String!, $id: ID!, $data: StoreWorkflowInput!) {
        workflows {
            storeWorkflow(app: $app, id: $id, data: $data) {
                data {
                    ${WORKFLOW_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

class StoreWorkflowGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(workflow: IWorkflow): Promise<IWorkflow> {
        const response = await this.client.execute<StoreWorkflowResponse>({
            query: STORE_WORKFLOW_MUTATION,
            variables: {
                app: workflow.app,
                id: workflow.id,
                data: {
                    name: workflow.name,
                    steps: workflow.steps
                }
            }
        });

        const { data, error } = response.workflows.storeWorkflow;

        if (!data) {
            throw new Error(error?.message || "Failed to store workflow");
        }

        return data;
    }
}

export const StoreWorkflowGateway = GatewayAbstraction.createImplementation({
    implementation: StoreWorkflowGatewayImpl,
    dependencies: [MainGraphQLClient]
});
