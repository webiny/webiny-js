import type { ApolloClient } from "apollo-client";
import zod from "zod";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import { createZodError } from "@webiny/utils/createZodError.js";
import gql from "graphql-tag";
import { createSchedulerEntryFields } from "./graphql/fields.js";
import { type SchedulerEntry, type SchedulerErrorResponse, ScheduleActionType } from "~/types.js";
import type {
    IScheduleUnpublishActionGateway,
    IScheduleUnpublishActionGatewayExecuteParams
} from "./abstractions/ScheduleUnpublishActionGateway.js";

const createScheduleUnpublishActionMutation = () => {
    return gql`
        mutation ScheduleUnpublishAction($namespace: String!, $targetId: ID!, $scheduleFor: DateTime, $actionType: ScheduleRecordType!) {
            scheduler {
                createScheduledAction(namespace: $namespace, targetId: $targetId, scheduleFor: $scheduleFor, actionType: $actionType) {
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

interface SchedulerUnpublishGraphQLMutationVariables {
    namespace: string;
    targetId: string;
    scheduleFor: Date;
    actionType: ScheduleActionType.unpublish;
}

interface SchedulerUnpublishGraphQLMutationResponse {
    scheduler: {
        createScheduledAction: {
            data: SchedulerEntry | null;
            error: SchedulerErrorResponse | null;
        };
    };
}

const schema = zod.object({
    data: schedulerEntrySchema
});

export class SchedulerUnpublishGraphQLGateway implements IScheduleUnpublishActionGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(params: IScheduleUnpublishActionGatewayExecuteParams) {
        const { data: response, errors } = await this.client.mutate<
            SchedulerUnpublishGraphQLMutationResponse,
            SchedulerUnpublishGraphQLMutationVariables
        >({
            mutation: createScheduleUnpublishActionMutation(),
            variables: {
                namespace: params.namespace,
                targetId: params.targetId,
                scheduleFor: params.scheduleOn,
                actionType: ScheduleActionType.unpublish
            },
            fetchPolicy: "no-cache"
        });

        const result = response?.scheduler?.createScheduledAction;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while creating a schedule.");
        }

        if (!result.data) {
            throw new Error(result.error?.message || "Could execute schedule unpublish action.");
        }

        const validated = await schema.safeParseAsync(result);
        if (!validated.success) {
            const err = createZodError(validated.error);
            console.error(err);
            throw err;
        }
        return {
            item: validated.data.data
        };
    }
}
