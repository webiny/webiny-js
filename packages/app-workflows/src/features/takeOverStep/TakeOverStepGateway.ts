import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WORKFLOW_STATE_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import { TakeOverStepGateway as GatewayAbstraction, type ITakeOverStepParams } from "./abstractions.js";
import type { IWorkflowState } from "~/types.js";

interface TakeOverStepResponse {
    workflows: {
        takeOverWorkflowStateStep: {
            data: IWorkflowState | null;
            error: { message: string } | null;
        };
    };
}

const TAKE_OVER_STEP_MUTATION = /* GraphQL */ `
    mutation TakeOverWorkflowStateStep($id: ID!) {
        workflows {
            takeOverWorkflowStateStep(id: $id) {
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

class TakeOverStepGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: ITakeOverStepParams): Promise<IWorkflowState> {
        const response = await this.client.execute<TakeOverStepResponse>({
            query: TAKE_OVER_STEP_MUTATION,
            variables: { id: params.id }
        });

        const { data, error } = response.workflows.takeOverWorkflowStateStep;

        if (!data) {
            throw new Error(error?.message || "Failed to take over workflow step");
        }

        return data;
    }
}

export const TakeOverStepGateway = GatewayAbstraction.createImplementation({
    implementation: TakeOverStepGatewayImpl,
    dependencies: [MainGraphQLClient]
});
