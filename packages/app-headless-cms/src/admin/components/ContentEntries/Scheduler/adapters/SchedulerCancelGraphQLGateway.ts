import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse } from "@webiny/app-headless-cms-common/types/index.js";
import gql from "graphql-tag";
import type {
    IScheduleCancelExecuteParams,
    ISchedulerCancelGateway
} from "@webiny/app-headless-cms-scheduler/index.js";

const createSchedulerCancelMutation = () => {
    return gql`
        mutation SchedulerCancel($id: ID!) {
            cancelCmsSchedule(id: $id) {
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
        const { data: response, errors } = await this.client.query<
            SchedulerCancelGraphQLMutationResponse,
            SchedulerCancelGraphQLMutationVariables
        >({
            query: createSchedulerCancelMutation(),
            variables: {
                id: params.id
            },
            fetchPolicy: "network-only"
        });

        const result = response.cancelCmsSchedule;
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
