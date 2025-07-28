import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse } from "@webiny/app-headless-cms-common/types";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import type {
    ISchedulerGetExecuteParams,
    ISchedulerGetGateway
} from "@webiny/app-headless-cms-scheduler/index.js";
import type { SchedulerEntry } from "@webiny/app-headless-cms-scheduler/types.js";
import { createSchedulerEntryFields } from "./graphql/fields.js";

const createSchedulerGetQuery = () => {
    return gql`
        query SchedulerGetQuery($modelId: String!, $id: ID!) {
            getCmsSchedule(modelId: $modelId, id: $id) {
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

interface SchedulerGetGraphQLQueryVariables extends ISchedulerGetExecuteParams {}

interface SchedulerGetGraphQLQueryResponse {
    getCmsSchedule: {
        data: SchedulerEntry | null;
        error: CmsErrorResponse | null;
    };
}

const schema = zod.object({
    data: schedulerEntrySchema
});

export class SchedulerGetGraphQLGateway implements ISchedulerGetGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(params: ISchedulerGetExecuteParams) {
        const { data: response, errors } = await this.client.query<
            SchedulerGetGraphQLQueryResponse,
            SchedulerGetGraphQLQueryVariables
        >({
            query: createSchedulerGetQuery(),
            variables: {
                ...params
            },
            fetchPolicy: "network-only"
        });

        const result = response.getCmsSchedule;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while getting schedule entry.");
        }

        if (!result.data) {
            throw new Error(result.error?.message || "Could not fetch scheduled entry.");
        }

        const validated = await schema.safeParseAsync(result);
        if (!validated.success) {
            throw createZodError(validated.error);
        }

        return {
            item: validated.data.data
        };
    }
}
