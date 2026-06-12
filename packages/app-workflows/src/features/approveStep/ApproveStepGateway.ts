import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WORKFLOW_STATE_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import { ApproveStepGateway as GatewayAbstraction, type IApproveStepParams } from "./abstractions.js";
import type { IWorkflowState } from "~/types.js";

interface ApproveStepResponse {
    workflows: {
        approveWorkflowStateStep: {
            data: IWorkflowState | null;
            error: { message: string } | null;
        };
    };
}

const APPROVE_STEP_MUTATION = /* GraphQL */ `
    mutation ApproveWorkflowStateStep($id: ID!, $comment: String) {
        workflows {
            approveWorkflowStateStep(id: $id, comment: $comment) {
                data {
                    ${WORKFLOW_STATE_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

class ApproveStepGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: IApproveStepParams): Promise<IWorkflowState> {
        const response = await this.client.execute<ApproveStepResponse>({
            query: APPROVE_STEP_MUTATION,
            variables: { id: params.id, comment: params.comment }
        });

        const { data, error } = response.workflows.approveWorkflowStateStep;

        if (!data) {
            throw new Error(error?.message || "Failed to approve workflow step");
        }

        return data;
    }
}

export const ApproveStepGateway = GatewayAbstraction.createImplementation({
    implementation: ApproveStepGatewayImpl,
    dependencies: [MainGraphQLClient]
});
