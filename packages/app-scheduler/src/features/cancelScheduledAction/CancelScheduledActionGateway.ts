import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    CancelScheduledActionGateway as GatewayAbstraction,
    type ICancelScheduledActionGatewayParams
} from "./abstractions.js";
import type { SchedulerErrorResponse } from "~/types.js";

const CANCEL_SCHEDULED_ACTION_MUTATION = /* GraphQL */ `
    mutation ScheduleCancelAction($namespace: String!, $id: ID!) {
        scheduler {
            cancelScheduledAction(namespace: $namespace, id: $id) {
                data
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

interface CancelScheduledActionResponse {
    scheduler: {
        cancelScheduledAction: {
            data: boolean | null;
            error: SchedulerErrorResponse | null;
        };
    };
}

class CancelScheduledActionGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: ICancelScheduledActionGatewayParams): Promise<void> {
        const response = await this.client.execute<CancelScheduledActionResponse>({
            query: CANCEL_SCHEDULED_ACTION_MUTATION,
            variables: {
                namespace: params.namespace,
                id: params.id
            }
        });

        const result = response?.scheduler?.cancelScheduledAction;
        if (!result) {
            throw new Error("Network error while canceling a scheduled action.");
        }

        if (!result.data) {
            throw new Error(result.error?.message || "Could not cancel scheduled action.");
        }
    }
}

export const CancelScheduledActionGateway = GatewayAbstraction.createImplementation({
    implementation: CancelScheduledActionGatewayImpl,
    dependencies: [MainGraphQLClient]
});
