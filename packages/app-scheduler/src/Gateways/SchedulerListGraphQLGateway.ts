import type { ApolloClient } from "apollo-client";
import type {
    CmsErrorResponse,
    CmsMetaResponse
} from "@webiny/app-headless-cms-common/types/index.js";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import type {
    IListScheduleActionsExecuteParams,
    IListScheduleActionsGateway,
    IListScheduleActionsGatewayResponse
} from "@webiny/app-headless-cms-scheduler";
import type { SchedulerEntry } from "@webiny/app-headless-cms-scheduler/types.js";
import { createSchedulerEntryFields } from "./graphql/fields.js";

const createListScheduleActionsQuery = () => {
    return gql`
        query ListScheduleActions(
            $app: String!
            $where: ListSchedulesWhereInput
            $sort: [ListSchedulesSorter!]
            $limit: Int
            $after: String
        ) {
            listScheduleActions(
                app: $app
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

type SchedulerListGraphQLQueryVariables = IListScheduleActionsExecuteParams;

interface SchedulerListGraphQLQueryResponse {
    listScheduleActions: {
        data: SchedulerEntry[] | null;
        meta: CmsMetaResponse | null;
        error: CmsErrorResponse | null;
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
        params: IListScheduleActionsExecuteParams
    ): Promise<IListScheduleActionsGatewayResponse> {
        const { data: response, errors } = await this.client.query<
            SchedulerListGraphQLQueryResponse,
            SchedulerListGraphQLQueryVariables
        >({
            query: createListScheduleActionsQuery(),
            variables: {
                ...params
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
