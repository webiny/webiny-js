import type { ApolloClient } from "apollo-client";
import gql from "graphql-tag";
import type { SchedulerErrorResponse } from "~/types.js";
import type {
    ICancelScheduleActionGateway,
    ICancelScheduleActionGatewayParams
} from "./abstractions/CancelScheduleActionGateway.js";

const createScheduleCancelActionMutation = () => {
    return gql`
        mutation ScheduleCancelAction($namespace: String!, $id: ID!) {
            cancelScheduleAction(namespace: $namespace, id: $id) {
                data
                error {
                    message
                    code
                    data
                    stack
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
    cancelScheduleAction: {
        data: boolean | null;
        error: SchedulerErrorResponse | null;
    };
}

export class SchedulerCancelGraphQLGateway implements ICancelScheduleActionGateway {
    private readonly client: ApolloClient<object>;

    public constructor(client: ApolloClient<object>) {
        this.client = client;
    }

    public async execute(params: ICancelScheduleActionGatewayParams) {
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

        const result = response?.cancelScheduleAction;
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
