import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { schedulerEntrySchema } from "~/features/schema/schedulerEntry.js";
import { SCHEDULER_ENTRY_FIELDS, ERROR_FIELDS } from "~/features/graphqlFields.js";
import {
    ListScheduledActionsGateway as GatewayAbstraction,
    type IListScheduledActionsGatewayExecuteParams,
    type IListScheduledActionsGatewayExecuteResponse
} from "./abstractions.js";
import type { SchedulerEntry, SchedulerErrorResponse, SchedulerMetaResponse } from "~/types.js";

const LIST_SCHEDULED_ACTIONS_QUERY = /* GraphQL */ `
    query ListScheduledActions(
        $namespace: String!
        $where: ListScheduledActionsWhereInput
        $sort: [ListScheduledActionsSorter!]
        $limit: Int
        $after: String
    ) {
        scheduler {
            listScheduledActions(
                namespace: $namespace
                where: $where
                sort: $sort
                limit: $limit
                after: $after
            ) {
                data {
                    ${SCHEDULER_ENTRY_FIELDS}
                }
                meta {
                    totalCount
                    cursor
                    hasMoreItems
                }
                error {
                    ${ERROR_FIELDS}
                }
            }
        }
    }
`;

interface ListScheduledActionsResponse {
    scheduler: {
        listScheduledActions: {
            data: SchedulerEntry[] | null;
            meta: SchedulerMetaResponse | null;
            error: SchedulerErrorResponse | null;
        };
    };
}

const schema = zod.object({
    data: zod.array(schedulerEntrySchema),
    meta: zod.object({
        totalCount: zod.number(),
        cursor: zod.string().nullable(),
        hasMoreItems: zod.boolean()
    })
});

class ListScheduledActionsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(
        params: IListScheduledActionsGatewayExecuteParams
    ): Promise<IListScheduledActionsGatewayExecuteResponse> {
        const response = await this.client.execute<ListScheduledActionsResponse>({
            query: LIST_SCHEDULED_ACTIONS_QUERY,
            variables: {
                namespace: params.namespace,
                where: params.where,
                limit: params.limit,
                after: params.after,
                sort: params.sort
            }
        });

        const result = response?.scheduler?.listScheduledActions;
        if (!result) {
            throw new Error("Network error while listing scheduled actions.");
        }

        if (!result.data || !result.meta) {
            throw new Error(result.error?.message || "Could not list schedule actions.");
        }

        const validated = await schema.safeParseAsync(result);
        if (!validated.success) {
            const err = createZodError(validated.error);
            console.error(err);
            throw err;
        }

        return {
            items: validated.data.data,
            meta: validated.data.meta
        };
    }
}

export const ListScheduledActionsGateway = GatewayAbstraction.createImplementation({
    implementation: ListScheduledActionsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
