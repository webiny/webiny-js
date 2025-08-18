import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse, CmsMetaResponse } from "@webiny/app-headless-cms-common/types";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { schedulerEntrySchema } from "./schema/schedulerEntry.js";
import type {
    ISchedulerListExecuteParams,
    ISchedulerListGateway,
    ISchedulerListGatewayResponse
} from "@webiny/app-headless-cms-scheduler/index.js";
import type { SchedulerEntry } from "@webiny/app-headless-cms-scheduler/types.js";
import { createSchedulerEntryFields } from "./graphql/fields.js";

const createSchedulerListQuery = () => {
    return gql`
        query SchedulerListQuery(
            $modelId: String!
            $where: CmsListSchedulesWhereInput
            $sort: [CmsListSchedulesSorter!]
            $limit: Int
            $after: String
        ) {
            listCmsSchedules(
                modelId: $modelId
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

type SchedulerListGraphQLQueryVariables = ISchedulerListExecuteParams;

interface SchedulerListGraphQLQueryResponse {
    listCmsSchedules: {
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

export class SchedulerListGraphQLGateway implements ISchedulerListGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(
        params: ISchedulerListExecuteParams
    ): Promise<ISchedulerListGatewayResponse> {
        const { data: response, errors } = await this.client.query<
            SchedulerListGraphQLQueryResponse,
            SchedulerListGraphQLQueryVariables
        >({
            query: createSchedulerListQuery(),
            variables: {
                ...params
            },
            fetchPolicy: "network-only"
        });

        const result = response.listCmsSchedules;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while listing scheduled entries.");
        }

        if (!result.data || !result.meta) {
            throw new Error(result.error?.message || "Could not fetch scheduled entries.");
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
