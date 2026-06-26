import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WORKFLOW_STATE_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import { StartStepGateway as GatewayAbstraction, type IStartStepParams } from "./abstractions.js";
import type { IWorkflowState } from "~/types.js";

interface StartStepResponse {
    workflows: {
        startWorkflowStateStep: {
            data: IWorkflowState | null;
            error: { message: string } | null;
        };
    };
}

const START_STEP_MUTATION = /* GraphQL */ `
    mutation StartWorkflowStateStep($id: ID!) {
        workflows {
            startWorkflowStateStep(id: $id) {
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

class StartStepGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: IStartStepParams): Promise<IWorkflowState> {
        const response = await this.client.execute<StartStepResponse>({
            query: START_STEP_MUTATION,
            variables: { id: params.id }
        });

        const { data, error } = response.workflows.startWorkflowStateStep;

        if (!data) {
            throw new Error(error?.message || "Failed to start workflow step");
        }

        return data;
    }
}

export const StartStepGateway = GatewayAbstraction.createImplementation({
    implementation: StartStepGatewayImpl,
    dependencies: [MainGraphQLClient]
});
