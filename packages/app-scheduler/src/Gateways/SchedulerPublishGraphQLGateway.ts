import type { ApolloClient } from "apollo-client";
import zod from "zod";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import { createZodError } from "@webiny/utils/createZodError.js";
import gql from "graphql-tag";
import { createSchedulerEntryFields } from "./graphql/fields.js";
import { type SchedulerEntry, type SchedulerErrorResponse, ScheduleActionType } from "~/types.js";
import type {
    ISchedulePublishActionGateway,
    ISchedulePublishActionGatewayExecuteParams,
    ISchedulePublishActionGatewayExecuteResponse
} from "./abstractions/SchedulePublishActionGateway.js";

const createSchedulePublishActionMutation = () => {
    return gql`
        mutation CreateSchedulePublishAction($namespace: String!, $targetId: ID!, $scheduleFor: DateTime, $actionType: ScheduleRecordType!) {
            scheduler {
                scheduleAction(namespace: $namespace, targetId: $targetId, scheduleFor: $scheduleFor, actionType: $actionType) {
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
        }
    `;
};

interface SchedulerPublishGraphQLMutationVariables {
    namespace: string;
    targetId: string;
    scheduleFor: Date;
    actionType: ScheduleActionType.publish;
}

interface SchedulerPublishGraphQLMutationResponse {
    scheduler: {
        scheduleAction: {
            data: SchedulerEntry | null;
            error: SchedulerErrorResponse | null;
        };
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
                targetId: params.targetId,
                scheduleFor: params.scheduleOn,
                actionType: ScheduleActionType.publish
            },
            fetchPolicy: "no-cache"
        });

        const result = response?.scheduler?.scheduleAction;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while scheduling an action.");
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
