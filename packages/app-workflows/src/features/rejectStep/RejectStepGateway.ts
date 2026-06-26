import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WORKFLOW_STATE_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import { RejectStepGateway as GatewayAbstraction, type IRejectStepParams } from "./abstractions.js";
import type { IWorkflowState } from "~/types.js";

interface RejectStepResponse {
    workflows: {
        rejectWorkflowStateStep: {
            data: IWorkflowState | null;
            error: { message: string } | null;
        };
    };
}

const REJECT_STEP_MUTATION = /* GraphQL */ `
    mutation RejectWorkflowStateStep($id: ID!, $comment: String!) {
        workflows {
            rejectWorkflowStateStep(id: $id, comment: $comment) {
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

class RejectStepGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: IRejectStepParams): Promise<IWorkflowState> {
        const response = await this.client.execute<RejectStepResponse>({
            query: REJECT_STEP_MUTATION,
            variables: { id: params.id, comment: params.comment }
        });

        const { data, error } = response.workflows.rejectWorkflowStateStep;

        if (!data) {
            throw new Error(error?.message || "Failed to reject workflow step");
        }

        return data;
    }
}

export const RejectStepGateway = GatewayAbstraction.createImplementation({
    implementation: RejectStepGatewayImpl,
    dependencies: [MainGraphQLClient]
});
