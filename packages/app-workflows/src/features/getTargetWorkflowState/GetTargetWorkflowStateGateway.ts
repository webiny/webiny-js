import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WORKFLOW_STATE_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    GetTargetWorkflowStateGateway as GatewayAbstraction,
    type IGetTargetWorkflowStateParams
} from "./abstractions.js";
import type { IWorkflowState } from "~/types.js";

interface GetTargetWorkflowStateResponse {
    workflows: {
        getTargetWorkflowState: {
            data: IWorkflowState | null;
            error: { message: string } | null;
        };
    };
}

const GET_TARGET_WORKFLOW_STATE_QUERY = /* GraphQL */ `
    query GetTargetWorkflowState($app: String!, $targetRevisionId: ID!) {
        workflows {
            getTargetWorkflowState(app: $app, targetRevisionId: $targetRevisionId) {
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

class GetTargetWorkflowStateGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: IGetTargetWorkflowStateParams): Promise<IWorkflowState | null> {
        const response = await this.client.execute<GetTargetWorkflowStateResponse>({
            query: GET_TARGET_WORKFLOW_STATE_QUERY,
            variables: { app: params.app, targetRevisionId: params.targetRevisionId }
        });

        const { data, error } = response.workflows.getTargetWorkflowState;

        if (error) {
            throw new Error(error.message);
        }

        return data;
    }
}

export const GetTargetWorkflowStateGateway = GatewayAbstraction.createImplementation({
    implementation: GetTargetWorkflowStateGatewayImpl,
    dependencies: [MainGraphQLClient]
});
