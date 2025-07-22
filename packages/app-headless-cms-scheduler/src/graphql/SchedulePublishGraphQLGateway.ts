import type { ISchedulePublishGraphQLGateway } from "./abstractions/SchedulePublishGraphQLGateway";
import type { ApolloClient } from "apollo-client";
import type { ISchedulePublishGraphQLMutationParams } from "./abstractions/SchedulePublishGraphQLGateway.js";
import type { ScheduleEntry } from "~/types.js";
import { ScheduleType } from "~/types.js";
import type { CmsErrorResponse } from "@webiny/app-headless-cms-common/types/index.js";
import zod from "zod";
import { scheduleEntrySchema } from "~/graphql/schema/scheduleEntry.js";
import { createZodError } from "@webiny/utils/createZodError";
import gql from "graphql-tag";

const createSchedulePublishMutation = () => {
    return gql`
        mutation SchedulePublish($modelId: ID!, $id: ID!, $input: CmsCreateScheduleInput!) {
            createCmsSchedule(modelId: $modelId, id: $id, input: $input) {
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

interface SchedulePublishGraphQLMutationVariables {
    modelId: string;
    id: string;
    input: {
        scheduleOn: Date;
        type: ScheduleType.publish;
    };
}

interface SchedulePublishGraphQLMutationResponse {
    createCmsSchedule: {
        data: ScheduleEntry | null;
        error: CmsErrorResponse | null;
    };
}

const schema = zod.object({
    data: scheduleEntrySchema
});

export class SchedulePublishGraphQLGateway implements ISchedulePublishGraphQLGateway {
    private readonly client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(params: ISchedulePublishGraphQLMutationParams) {
        const { data: response, errors } = await this.client.query<
            SchedulePublishGraphQLMutationResponse,
            SchedulePublishGraphQLMutationVariables
        >({
            query: createSchedulePublishMutation(),
            variables: {
                modelId: params.modelId,
                id: params.id,
                input: {
                    scheduleOn: params.scheduleOn,
                    type: ScheduleType.publish
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
            throw new Error(result.error?.message || "Could not schedule entry to be published.");
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
