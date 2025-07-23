import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse, CmsModel } from "@webiny/app-headless-cms-common/types";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { scheduleEntrySchema } from "./schema/scheduleEntry.js";
import type {
    IScheduleGetGraphQLGateway,
    IScheduleGetGraphQLQueryParams
} from "@webiny/app-headless-cms-scheduler/gateways/ScheduleGetGraphQLGateway.js";
import type { ScheduleEntry } from "@webiny/app-headless-cms-scheduler/types.js";

const createScheduleGetQuery = () => {
    return gql`
        query ScheduleGetQuery($modelId: ID!, $id: ID!) {
            getCmsSchedule(modelId: $modelId, id: $id) {
                data {
                    id
                    targetId
                    model
                    scheduledBy {
                        id
                        displayName
                        type
                    }
                    publishOn
                    unpublishOn
                    type
                    title
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

interface ScheduleGetGraphQLQueryVariables extends IScheduleGetGraphQLQueryParams {}

interface ScheduleGetGraphQLQueryResponse {
    getCmsSchedule: {
        data: ScheduleEntry | null;
        error: CmsErrorResponse | null;
    };
}

const schema = zod.object({
    data: scheduleEntrySchema
});

export class ScheduleGetGraphQLGateway implements IScheduleGetGraphQLGateway {
    private readonly client: ApolloClient<any>;
    private readonly model: CmsModel;

    public constructor(client: ApolloClient<any>, model: CmsModel) {
        this.client = client;
        this.model = model;
    }

    public async execute(params: IScheduleGetGraphQLQueryParams) {
        const { data: response, errors } = await this.client.query<
            ScheduleGetGraphQLQueryResponse,
            ScheduleGetGraphQLQueryVariables
        >({
            query: createScheduleGetQuery(),
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
