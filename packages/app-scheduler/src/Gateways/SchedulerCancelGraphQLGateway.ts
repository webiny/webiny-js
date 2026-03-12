import type { ApolloClient } from "apollo-client";
import gql from "graphql-tag";
import type { SchedulerErrorResponse } from "~/types.js";
import type {
    ICancelScheduledActionGateway,
    ICancelScheduledActionGatewayParams
} from "./abstractions/CancelScheduledActionGateway.js";

const createScheduleCancelActionMutation = () => {
    return gql`
        mutation ScheduleCancelAction($namespace: String!, $id: ID!) {
            scheduler {
                cancelScheduledAction(namespace: $namespace, id: $id) {
                    data
                    error {
                        message
                        code
                        data
                        stack
                    }
                }
            }
        }
    `;
};

interface SchedulerCancelGraphQLMutationVariables {
    namespace: string;
    id: string;
}

interface SchedulerCancelGraphQLMutationResponse {
    scheduler: {
        cancelScheduledAction: {
            data: boolean | null;
            error: SchedulerErrorResponse | null;
        };
    };
}

export class SchedulerCancelGraphQLGateway implements ICancelScheduledActionGateway {
    private readonly client: ApolloClient<object>;

    public constructor(client: ApolloClient<object>) {
        this.client = client;
    }

    public async execute(params: ICancelScheduledActionGatewayParams) {
        const { data: response, errors } = await this.client.mutate<
            SchedulerCancelGraphQLMutationResponse,
            SchedulerCancelGraphQLMutationVariables
        >({
            mutation: createScheduleCancelActionMutation(),
            variables: {
                namespace: params.namespace,
                id: params.id
            },
            fetchPolicy: "no-cache"
        });

        const result = response?.scheduler?.cancelScheduledAction;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while canceling a scheduled action.");
        }

        if (!result.data) {
            throw new Error(result.error?.message || "Could not cancel scheduled action.");
        }
    }
}
