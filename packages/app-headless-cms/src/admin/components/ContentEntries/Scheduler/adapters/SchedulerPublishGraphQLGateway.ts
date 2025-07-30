import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse } from "@webiny/app-headless-cms-common/types/index.js";
import zod from "zod";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import { createZodError } from "@webiny/utils/createZodError";
import gql from "graphql-tag";
import type { SchedulerEntry } from "@webiny/app-headless-cms-scheduler/types.js";
import { ScheduleType } from "@webiny/app-headless-cms-scheduler/types.js";
import type {
    ISchedulerPublishExecuteParams,
    ISchedulerPublishGateway,
    ISchedulerPublishGatewayResponse
} from "@webiny/app-headless-cms-scheduler/index.js";
import { createSchedulerEntryFields } from "./graphql/fields.js";

const createSchedulerPublishMutation = () => {
    return gql`
        mutation SchedulerPublish($modelId: String!, $id: ID!, $input: CmsCreateScheduleInput!) {
            createCmsSchedule(modelId: $modelId, id: $id, input: $input) {
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

interface SchedulerPublishGraphQLMutationVariables {
    modelId: string;
    id: string;
    input: {
        scheduleOn: Date;
        type: ScheduleType.publish;
    };
}

interface SchedulerPublishGraphQLMutationResponse {
    createCmsSchedule: {
        data: SchedulerEntry | null;
        error: CmsErrorResponse | null;
    };
}

const schema = zod.object({
    data: schedulerEntrySchema
});

export class SchedulerPublishGraphQLGateway implements ISchedulerPublishGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(
        params: ISchedulerPublishExecuteParams
    ): Promise<ISchedulerPublishGatewayResponse> {
        const { data: response, errors } = await this.client.mutate<
            SchedulerPublishGraphQLMutationResponse,
            SchedulerPublishGraphQLMutationVariables
        >({
            mutation: createSchedulerPublishMutation(),
            variables: {
                modelId: params.modelId,
                id: params.id,
                input: {
                    scheduleOn: params.scheduleOn,
                    type: ScheduleType.publish
                }
            },
            fetchPolicy: "no-cache"
        });

        const result = response?.createCmsSchedule;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while creating a schedule.");
        }

        if (!result.data) {
            throw new Error(result.error?.message || "Could not schedule entry to be published.");
        }

        const validated = await schema.safeParseAsync(result);
        if (!validated.success) {
            const err = createZodError(validated.error);
            console.error({
                err,
                errS: JSON.stringify(err),
                error: JSON.stringify(validated.error)
            });
            throw err;
        }
        return {
            item: validated.data.data
        };
    }
}
