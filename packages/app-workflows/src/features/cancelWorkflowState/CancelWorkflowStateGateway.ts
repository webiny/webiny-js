import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    CancelWorkflowStateGateway as GatewayAbstraction,
    type ICancelWorkflowStateParams
} from "./abstractions.js";

interface CancelWorkflowStateResponse {
    workflows: {
        cancelWorkflowState: {
            data: boolean | null;
            error: { message: string } | null;
        };
    };
}

const CANCEL_WORKFLOW_STATE_MUTATION = /* GraphQL */ `
    mutation CancelWorkflowState($id: ID!) {
        workflows {
            cancelWorkflowState(id: $id) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

class CancelWorkflowStateGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: ICancelWorkflowStateParams): Promise<void> {
        const response = await this.client.execute<CancelWorkflowStateResponse>({
            query: CANCEL_WORKFLOW_STATE_MUTATION,
            variables: { id: params.id }
        });

        const { error } = response.workflows.cancelWorkflowState;

        if (error) {
            throw new Error(error.message);
        }
    }
}

export const CancelWorkflowStateGateway = GatewayAbstraction.createImplementation({
    implementation: CancelWorkflowStateGatewayImpl,
    dependencies: [MainGraphQLClient]
});
