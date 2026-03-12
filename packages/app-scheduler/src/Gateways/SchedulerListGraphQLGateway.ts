import type { ApolloClient } from "apollo-client";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import { createSchedulerEntryFields } from "./graphql/fields.js";
import type {
    IListScheduledActionsGateway,
    IListScheduledActionsGatewayExecuteParams,
    IListScheduledActionsGatewayExecuteResponse
} from "./abstractions/ListScheduledActionsGateway.js";
import type { SchedulerEntry, SchedulerErrorResponse, SchedulerMetaResponse } from "~/types.js";

const createListScheduledActionsQuery = () => {
    return gql`
        query ListScheduledActions(
            $namespace: String!
            $where: ListScheduledActionsWhereInput
            $sort: [ListScheduledActionsSorter!]
            $limit: Int
            $after: String
        ) {
            listScheduledActions(
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
    listScheduledActions: {
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

export class SchedulerListGraphQLGateway implements IListScheduledActionsGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(
        params: IListScheduledActionsGatewayExecuteParams
    ): Promise<IListScheduledActionsGatewayExecuteResponse> {
        const { data: response, errors } = await this.client.query<
            SchedulerListGraphQLQueryResponse,
            IListScheduledActionsGatewayExecuteParams
        >({
            query: createListScheduledActionsQuery(),
            variables: {
                namespace: params.namespace,
                where: params.where,
                limit: params.limit,
                after: params.after,
                sort: params.sort
            },
            fetchPolicy: "network-only"
        });

        const result = response.listScheduledActions;
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
