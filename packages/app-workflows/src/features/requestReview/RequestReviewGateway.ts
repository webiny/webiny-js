import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { WORKFLOW_STATE_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import { RequestReviewGateway as GatewayAbstraction, type IRequestReviewParams } from "./abstractions.js";
import type { IWorkflowState } from "~/types.js";

interface RequestReviewResponse {
    workflows: {
        createWorkflowState: {
            data: IWorkflowState | null;
            error: { message: string } | null;
        };
    };
}

const CREATE_WORKFLOW_STATE_MUTATION = /* GraphQL */ `
    mutation CreateWorkflowState($app: String!, $targetRevisionId: ID!, $title: String!) {
        workflows {
            createWorkflowState(app: $app, targetRevisionId: $targetRevisionId, title: $title) {
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

class RequestReviewGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: IRequestReviewParams): Promise<IWorkflowState> {
        const response = await this.client.execute<RequestReviewResponse>({
            query: CREATE_WORKFLOW_STATE_MUTATION,
            variables: params
        });

        const { data, error } = response.workflows.createWorkflowState;

        if (!data) {
            throw new Error(error?.message || "Failed to create workflow state");
        }

        return data;
    }
}

export const RequestReviewGateway = GatewayAbstraction.createImplementation({
    implementation: RequestReviewGatewayImpl,
    dependencies: [MainGraphQLClient]
});
