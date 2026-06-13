import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { schedulerEntrySchema } from "~/features/schema/schedulerEntry.js";
import { SCHEDULER_ENTRY_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    ScheduleUnpublishActionGateway as GatewayAbstraction,
    type IScheduleUnpublishActionGatewayExecuteParams,
    type IScheduleUnpublishActionGatewayExecuteResponse
} from "./abstractions.js";
import { type SchedulerEntry, type SchedulerErrorResponse, ScheduleActionType } from "~/types.js";

const SCHEDULE_UNPUBLISH_ACTION_MUTATION = /* GraphQL */ `
    mutation ScheduleUnpublishAction(
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

interface ScheduleUnpublishActionResponse {
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

class ScheduleUnpublishActionGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(
        params: IScheduleUnpublishActionGatewayExecuteParams
    ): Promise<IScheduleUnpublishActionGatewayExecuteResponse> {
        const response = await this.client.execute<ScheduleUnpublishActionResponse>({
            query: SCHEDULE_UNPUBLISH_ACTION_MUTATION,
            variables: {
                namespace: params.namespace,
                targetId: params.targetId,
                scheduleFor: params.scheduleOn,
                actionType: ScheduleActionType.unpublish
            }
        });

        const result = response?.scheduler?.scheduleAction;
        if (!result) {
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

export const ScheduleUnpublishActionGateway = GatewayAbstraction.createImplementation({
    implementation: ScheduleUnpublishActionGatewayImpl,
    dependencies: [MainGraphQLClient]
});
