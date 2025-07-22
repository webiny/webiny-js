import type { IScheduleCancelGraphQLGateway } from "./abstractions/ScheduleCancelGraphQLGateway";
import type { ApolloClient } from "apollo-client";
import type { IScheduleCancelGraphQLMutationParams } from "./abstractions/ScheduleCancelGraphQLGateway.js";
import type { CmsErrorResponse } from "@webiny/app-headless-cms-common/types/index.js";
import gql from "graphql-tag";

const createScheduleCancelMutation = () => {
    return gql`
        mutation ScheduleCancel($id: ID!) {
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

interface ScheduleCancelGraphQLMutationVariables {
    id: string;
}

interface ScheduleCancelGraphQLMutationResponse {
    cancelCmsSchedule: {
        data: boolean | null;
        error: CmsErrorResponse | null;
    };
}

export class ScheduleCancelGraphQLGateway implements IScheduleCancelGraphQLGateway {
    private readonly client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(params: IScheduleCancelGraphQLMutationParams) {
        const { data: response, errors } = await this.client.query<
            ScheduleCancelGraphQLMutationResponse,
            ScheduleCancelGraphQLMutationVariables
        >({
            query: createScheduleCancelMutation(),
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
