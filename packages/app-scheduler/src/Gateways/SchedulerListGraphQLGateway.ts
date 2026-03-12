import type { ApolloClient } from "apollo-client";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import { createSchedulerEntryFields } from "./graphql/fields.js";
import type {
    IListScheduleActionsGateway,
    IListScheduleActionsGatewayExecuteParams,
    IListScheduleActionsGatewayExecuteResponse
} from "./abstractions/ListScheduleActionsGateway.js";
import type { SchedulerEntry, SchedulerErrorResponse, SchedulerMetaResponse } from "~/types.js";

const createListScheduleActionsQuery = () => {
    return gql`
        query ListScheduleActions(
            $namespace: String!
            $where: ListScheduleActionsWhereInput
            $sort: [ListScheduleActionsSorter!]
            $limit: Int
            $after: String
        ) {
            listScheduleActions(
                namespace: $namespace
                where: $where
                sort: $sort
                limit: $limit
                after: $after
            ) {
                data {
                    ${createSchedulerEntryFields()}
                }
                meta {
                    totalCount
                    cursor
                    hasMoreItems
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

interface SchedulerListGraphQLQueryResponse {
    listScheduleActions: {
        data: SchedulerEntry[] | null;
        meta: SchedulerMetaResponse | null;
        error: SchedulerErrorResponse | null;
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

export class SchedulerListGraphQLGateway implements IListScheduleActionsGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(
        params: IListScheduleActionsGatewayExecuteParams
    ): Promise<IListScheduleActionsGatewayExecuteResponse> {
        const { data: response, errors } = await this.client.query<
            SchedulerListGraphQLQueryResponse,
            IListScheduleActionsGatewayExecuteParams
        >({
            query: createListScheduleActionsQuery(),
            variables: {
                namespace: params.namespace,
                where: params.where,
                limit: params.limit,
                after: params.after,
                sort: params.sort
            },
            fetchPolicy: "network-only"
        });

        const result = response.listScheduleActions;
        if (!result || errors?.length) {
            console.error({
                errors
            });
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
