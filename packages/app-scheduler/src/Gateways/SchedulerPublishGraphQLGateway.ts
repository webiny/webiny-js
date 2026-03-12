import type { ApolloClient } from "apollo-client";
import zod from "zod";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import { createZodError } from "@webiny/utils/createZodError.js";
import gql from "graphql-tag";
import { createSchedulerEntryFields } from "./graphql/fields.js";
import { type SchedulerEntry, type SchedulerErrorResponse, ScheduleType } from "~/types.js";
import type {
    ISchedulePublishActionGateway,
    ISchedulePublishActionGatewayExecuteParams,
    ISchedulePublishActionGatewayExecuteResponse
} from "./abstractions/SchedulePublishActionGateway.js";

const createSchedulePublishActionMutation = () => {
    return gql`
        mutation SchedulePublishAction($namespace: String!, $id: ID!, $scheduleFor: DateTime, $type: ScheduleRecordType!) {
            createScheduledAction(namespace: $namespace, id: $id, scheduleFor: $scheduleFor, type: $type) {
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
    namespace: string;
    id: string;
    scheduleFor: Date;
    type: ScheduleType.publish;
}

interface SchedulerPublishGraphQLMutationResponse {
    createScheduledAction: {
        data: SchedulerEntry | null;
        error: SchedulerErrorResponse | null;
    };
}

const schema = zod.object({
    data: schedulerEntrySchema
});

export class SchedulerPublishGraphQLGateway implements ISchedulePublishActionGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(
        params: ISchedulePublishActionGatewayExecuteParams
    ): Promise<ISchedulePublishActionGatewayExecuteResponse> {
        const { data: response, errors } = await this.client.mutate<
            SchedulerPublishGraphQLMutationResponse,
            SchedulerPublishGraphQLMutationVariables
        >({
            mutation: createSchedulePublishActionMutation(),
            variables: {
                namespace: params.namespace,
                id: params.id,
                scheduleFor: params.scheduleOn,
                type: ScheduleType.publish
            },
            fetchPolicy: "no-cache"
        });

        const result = response?.createScheduledAction;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while creating a schedule.");
        }

        if (!result.data) {
            throw new Error(result.error?.message || "Could execute schedule publish action.");
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
