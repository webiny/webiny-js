import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse } from "~/types.js";
import gql from "graphql-tag";
import type {
    IWbSchedulerCancelExecuteParams,
    IWbSchedulerCancelGateway
} from "~/Gateways/index.js";

const createWbSchedulerCancelMutation = () => {
    return gql`
        mutation CancelWbSchedule($id: ID!) {
            websiteBuilder {
                cancelWbSchedule(id: $id) {
                    data
                    error {
                        code
                        message
                        data
                    }
                }
            }
        }
    `;
};

interface WbSchedulerCancelGraphQLMutationVariables {
    id: string;
}

interface WbSchedulerCancelGraphQLMutationResponse {
    websiteBuilder: {
        cancelWbSchedule: {
            data: boolean | null;
            error: CmsErrorResponse | null;
        };
    };
}

export class WbSchedulerCancelGraphQLGateway implements IWbSchedulerCancelGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(params: IWbSchedulerCancelExecuteParams): Promise<void> {
        const { data: response, errors } = await this.client.mutate<
            WbSchedulerCancelGraphQLMutationResponse,
            WbSchedulerCancelGraphQLMutationVariables
        >({
            mutation: createWbSchedulerCancelMutation(),
            variables: {
                id: params.id
            },
            fetchPolicy: "no-cache"
        });

        const result = response?.websiteBuilder.cancelWbSchedule;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while canceling a WB schedule.");
        }

        if (result.data !== true) {
            throw new Error(result.error?.message || "Could not cancel WB schedule entry.");
        }
    }
}
