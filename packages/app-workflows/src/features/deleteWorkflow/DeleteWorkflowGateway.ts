import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/features/graphqlFields.js";
import { DeleteWorkflowGateway as GatewayAbstraction } from "./abstractions.js";
import type { IWorkflow } from "~/types.js";

interface DeleteWorkflowResponse {
    workflows: {
        deleteWorkflow: {
            data: boolean | null;
            error: { message: string } | null;
        };
    };
}

const DELETE_WORKFLOW_MUTATION = /* GraphQL */ `
    mutation DeleteWorkflow($app: String!, $id: ID!) {
        workflows {
            deleteWorkflow(app: $app, id: $id) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

class DeleteWorkflowGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(workflow: IWorkflow): Promise<void> {
        const response = await this.client.execute<DeleteWorkflowResponse>({
            query: DELETE_WORKFLOW_MUTATION,
            variables: { app: workflow.app, id: workflow.id }
        });

        const { error } = response.workflows.deleteWorkflow;

        if (error) {
            throw new Error(error.message);
        }
    }
}

export const DeleteWorkflowGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteWorkflowGatewayImpl,
    dependencies: [MainGraphQLClient]
});
