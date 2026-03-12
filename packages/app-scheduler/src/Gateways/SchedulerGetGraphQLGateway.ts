import type { ApolloClient } from "apollo-client";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import { createSchedulerEntryFields } from "./graphql/fields.js";
import type {
    IGetScheduleActionGateway,
    IGetScheduleActionGatewayExecuteParams
} from "./abstractions/GetScheduleActionGateway.js";
import type { SchedulerEntry, SchedulerErrorResponse } from "~/types.js";

export const createGetScheduleActionQuery = () => {
    return gql`
        query GetScheduleActionQuery($namespace: String!, $id: ID!) {
            getScheduleAction(namespace: $namespace, id: $id) {
                data {
                    ${createSchedulerEntryFields()}
                }
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

interface SchedulerGetGraphQLQueryResponse {
    getScheduleAction: {
        data: SchedulerEntry | null;
        error: SchedulerErrorResponse | null;
    };
}

const schema = zod.object({
    data: schedulerEntrySchema
});

export class SchedulerGetGraphQLGateway implements IGetScheduleActionGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(params: IGetScheduleActionGatewayExecuteParams) {
        const { data: response, errors } = await this.client.query<
            SchedulerGetGraphQLQueryResponse,
            IGetScheduleActionGatewayExecuteParams
        >({
            query: createGetScheduleActionQuery(),
            variables: {
                namespace: params.namespace,
                id: params.id
            },
            fetchPolicy: "network-only"
        });

        const result = response.getScheduleAction;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while getting scheduled action.");
        } else if (result.error) {
            console.error({
                error: result.error
            });
            throw new Error(result.error.message || "Could not fetch scheduled action.");
        } else if (!result.data) {
            return null;
        }

        const validated = await schema.safeParseAsync(result);
        if (!validated.success) {
            const err = createZodError(validated.error);
            console.error(err);
            console.log(
                JSON.stringify({
                    err,
                    ex: validated.error
                })
            );
            throw err;
        }

        return validated.data.data;
    }
}
