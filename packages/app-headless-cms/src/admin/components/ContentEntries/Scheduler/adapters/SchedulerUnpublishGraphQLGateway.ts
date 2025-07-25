import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse } from "@webiny/app-headless-cms-common/types/index.js";
import zod from "zod";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import { createZodError } from "@webiny/utils/createZodError";
import gql from "graphql-tag";
import type {
    ISchedulerUnpublishExecuteParams,
    ISchedulerUnpublishGateway
} from "@webiny/app-headless-cms-scheduler/index.js";
import type { SchedulerEntry } from "@webiny/app-headless-cms-scheduler/types.js";
import { ScheduleType } from "@webiny/app-headless-cms-scheduler/types.js";

const createSchedulerUnpublishMutation = () => {
    return gql`
        mutation SchedulerUnpublish($modelId: ID!, $id: ID!, $input: CmsCreateScheduleInput!) {
            createCmsSchedule(modelId: $modelId, id: $id, input: $input) {
                data {
                    id
                    targetId
                    model {
                        modelId
                    }
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

interface SchedulerUnpublishGraphQLMutationVariables {
    modelId: string;
    id: string;
    input: {
        scheduleOn: Date;
        type: ScheduleType.unpublish;
    };
}

interface SchedulerUnpublishGraphQLMutationResponse {
    createCmsSchedule: {
        data: SchedulerEntry | null;
        error: CmsErrorResponse | null;
    };
}

const schema = zod.object({
    data: schedulerEntrySchema
});

export class SchedulerUnpublishGraphQLGateway implements ISchedulerUnpublishGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(params: ISchedulerUnpublishExecuteParams) {
        const { data: response, errors } = await this.client.query<
            SchedulerUnpublishGraphQLMutationResponse,
            SchedulerUnpublishGraphQLMutationVariables
        >({
            query: createSchedulerUnpublishMutation(),
            variables: {
                modelId: params.modelId,
                id: params.id,
                input: {
                    scheduleOn: params.scheduleOn,
                    type: ScheduleType.unpublish
                }
            },
            fetchPolicy: "network-only"
        });

        const result = response.createCmsSchedule;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while creating a schedule.");
        }

        if (!result.data) {
            throw new Error(result.error?.message || "Could not schedule entry to be unpublished.");
        }

        const validated = await schema.safeParseAsync(result.data);
        if (!validated.success) {
            throw createZodError(validated.error);
        }
        return {
            item: validated.data.data
        };
    }
}
