import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse } from "@webiny/app-headless-cms-common/types/index.js";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import type {
    ISchedulerGetExecuteParams,
    IGetScheduleActionGateway
} from "@webiny/app-headless-cms-scheduler";
import type { SchedulerEntry } from "@webiny/app-headless-cms-scheduler/types.js";
import { createSchedulerEntryFields } from "./graphql/fields.js";

const createGetScheduleActionQuery = () => {
    return gql`
        query GetScheduleActionQuery($app: String!, $id: ID!) {
            getScheduleAction(app: $app, id: $id) {
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

type SchedulerGetGraphQLQueryVariables = ISchedulerGetExecuteParams;

interface SchedulerGetGraphQLQueryResponse {
    getScheduleAction: {
        data: SchedulerEntry | null;
        error: CmsErrorResponse | null;
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

    public async execute(params: ISchedulerGetExecuteParams) {
        const { data: response, errors } = await this.client.query<
            SchedulerGetGraphQLQueryResponse,
            SchedulerGetGraphQLQueryVariables
        >({
            query: createGetScheduleActionQuery(),
            variables: {
                ...params
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
