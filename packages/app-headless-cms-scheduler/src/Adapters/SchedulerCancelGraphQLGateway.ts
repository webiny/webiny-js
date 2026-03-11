import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse } from "@webiny/app-headless-cms-common/types/index.js";
import gql from "graphql-tag";
import type {
    IScheduleCancelExecuteParams,
    ISchedulerCancelGateway
} from "@webiny/app-headless-cms-scheduler";

const createSchedulerCancelMutation = () => {
    return gql`
        mutation SchedulerCancel($modelId: String!, $id: ID!) {
            cancelCmsSchedule(modelId: $modelId, id: $id) {
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
    modelId: string;
    id: string;
}

interface SchedulerCancelGraphQLMutationResponse {
    cancelCmsSchedule: {
        data: boolean | null;
        error: CmsErrorResponse | null;
    };
}

export class SchedulerCancelGraphQLGateway implements ISchedulerCancelGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(params: IScheduleCancelExecuteParams) {
        const { data: response, errors } = await this.client.mutate<
            SchedulerCancelGraphQLMutationResponse,
            SchedulerCancelGraphQLMutationVariables
        >({
            mutation: createSchedulerCancelMutation(),
            variables: {
                modelId: params.modelId,
                id: params.id
            },
            fetchPolicy: "no-cache"
        });

        const result = response?.cancelCmsSchedule;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while canceling a schedule.");
        }

        if (!result.data) {
            throw new Error(result.error?.message || "Could not cancel schedule entry.");
        }
    }
}
