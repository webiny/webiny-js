import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { schedulerEntrySchema } from "~/features/schema/schedulerEntry.js";
import { SCHEDULER_ENTRY_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    GetScheduledActionGateway as GatewayAbstraction,
    type IGetScheduledActionGatewayExecuteParams,
    type IGetScheduledActionGatewayResponse
} from "./abstractions.js";
import type { SchedulerEntry, SchedulerErrorResponse } from "~/types.js";

const GET_SCHEDULED_ACTION_QUERY = /* GraphQL */ `
    query GetTargetScheduledActionQuery($namespace: String!, $id: ID!) {
        scheduler {
            getTargetScheduledAction(namespace: $namespace, id: $id) {
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

interface GetScheduledActionResponse {
    scheduler: {
        getTargetScheduledAction: {
            data: SchedulerEntry | null;
            error: SchedulerErrorResponse | null;
        };
    };
}

const schema = zod.object({
    data: schedulerEntrySchema
});

class GetScheduledActionGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(
        params: IGetScheduledActionGatewayExecuteParams
    ): Promise<IGetScheduledActionGatewayResponse> {
        const response = await this.client.execute<GetScheduledActionResponse>({
            query: GET_SCHEDULED_ACTION_QUERY,
            variables: {
                namespace: params.namespace,
                id: params.id
            }
        });

        const result = response?.scheduler?.getTargetScheduledAction;
        if (!result) {
            throw new Error("Network error while getting scheduled action.");
        }

        if (result.error) {
            throw new Error(result.error.message || "Could not fetch scheduled action.");
        }

        if (!result.data) {
            return null;
        }

        const validated = await schema.safeParseAsync(result);
        if (!validated.success) {
            const err = createZodError(validated.error);
            console.error(err);
            throw err;
        }

        return validated.data.data;
    }
}

export const GetScheduledActionGateway = GatewayAbstraction.createImplementation({
    implementation: GetScheduledActionGatewayImpl,
    dependencies: [MainGraphQLClient]
});
