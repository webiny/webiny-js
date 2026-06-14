import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { schedulerEntrySchema } from "~/domain/schedulerEntry.js";
import { SCHEDULER_ENTRY_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    SchedulePublishActionGateway as GatewayAbstraction,
    type ISchedulePublishActionGatewayExecuteParams,
    type ISchedulePublishActionGatewayExecuteResponse
} from "./abstractions.js";
import { type SchedulerEntry, type SchedulerErrorResponse, ScheduleActionType } from "~/types.js";

const SCHEDULE_PUBLISH_ACTION_MUTATION = /* GraphQL */ `
    mutation CreateSchedulePublishAction(
        $namespace: String!
        $targetId: ID!
        $scheduleFor: DateTime
        $actionType: ScheduleRecordType!
    ) {
        scheduler {
            scheduleAction(
                namespace: $namespace
                targetId: $targetId
                scheduleFor: $scheduleFor
                actionType: $actionType
            ) {
                data {
                    ${SCHEDULER_ENTRY_FIELDS}
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

interface SchedulePublishActionResponse {
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

class SchedulePublishActionGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(
        params: ISchedulePublishActionGatewayExecuteParams
    ): Promise<ISchedulePublishActionGatewayExecuteResponse> {
        const response = await this.client.execute<SchedulePublishActionResponse>({
            query: SCHEDULE_PUBLISH_ACTION_MUTATION,
            variables: {
                namespace: params.namespace,
                targetId: params.targetId,
                scheduleFor: params.scheduleOn,
                actionType: ScheduleActionType.publish
            }
        });

        const result = response?.scheduler?.scheduleAction;
        if (!result) {
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

export const SchedulePublishActionGateway = GatewayAbstraction.createImplementation({
    implementation: SchedulePublishActionGatewayImpl,
    dependencies: [MainGraphQLClient]
});
