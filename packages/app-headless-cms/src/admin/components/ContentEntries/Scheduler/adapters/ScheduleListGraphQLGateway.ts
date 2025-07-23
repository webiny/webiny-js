import type { ApolloClient } from "apollo-client";
import type {
    CmsErrorResponse,
    CmsMetaResponse,
    CmsModel
} from "@webiny/app-headless-cms-common/types";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { scheduleEntrySchema } from "./schema/scheduleEntry.js";
import type {
    IScheduleListGraphQLGateway,
    IScheduleListGraphQLQueryParams
} from "@webiny/app-headless-cms-scheduler/gateways/ScheduleListGraphQLGateway.js";
import type { ScheduleEntry } from "@webiny/app-headless-cms-scheduler/types.js";

const createScheduleListQuery = () => {
    return gql`
        query ScheduleListQuery(
            $modelId: ID!
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
                    id
                    targetId
                    model
                    scheduledBy {
                        id
                        displayName
                        type
                    }
                    publishOn
                    unpublishOn
                    type
                    title
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

interface ScheduleListGraphQLQueryVariables extends IScheduleListGraphQLQueryParams {}

interface ScheduleListGraphQLQueryResponse {
    listCmsSchedules: {
        data: ScheduleEntry[] | null;
        meta: CmsMetaResponse | null;
        error: CmsErrorResponse | null;
    };
}

const schema = zod.object({
    data: zod.array(scheduleEntrySchema),
    meta: zod.object({
        totalCount: zod.number(),
        cursor: zod.string().nullable(),
        hasMoreItems: zod.boolean()
    })
});

export class ScheduleListGraphQLGateway implements IScheduleListGraphQLGateway {
    private readonly client: ApolloClient<any>;
    private readonly model: CmsModel;

    public constructor(client: ApolloClient<any>, model: CmsModel) {
        this.client = client;
        this.model = model;
    }

    public async execute(params: IScheduleListGraphQLQueryParams) {
        const { data: response, errors } = await this.client.query<
            ScheduleListGraphQLQueryResponse,
            ScheduleListGraphQLQueryVariables
        >({
            query: createScheduleListQuery(),
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
            throw createZodError(validated.error);
        }

        return {
            items: validated.data.data,
            meta: validated.data.meta
        };
    }
}
