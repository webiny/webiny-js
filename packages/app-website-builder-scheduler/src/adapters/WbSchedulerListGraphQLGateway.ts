import type { ApolloClient } from "apollo-client";
import type { CmsErrorResponse, SchedulerMetaResponse } from "~/types.js";
import gql from "graphql-tag";
import zod from "zod";
import { createZodError } from "@webiny/utils/createZodError.js";
import { wbSchedulerEntrySchema } from "./schema/wbSchedulerEntry.js";
import type {
    IWbSchedulerListExecuteParams,
    IWbSchedulerListExecuteParamsSort,
    IWbSchedulerListExecuteParamsWhere,
    IWbSchedulerListGateway,
    IWbSchedulerListGatewayResponse
} from "~/Gateways/index.js";
import type { WbSchedulerEntry } from "~/types.js";
import { WB_SCHEDULE_RECORD_FIELDS } from "./graphql/fields.js";

const createWbSchedulerListQuery = () => {
    return gql`
        query ListWbSchedules(
            $where: WbListSchedulesWhereInput
            $sort: [WbListSchedulesSorter!]
            $limit: Int
            $after: String
        ) {
            websiteBuilder {
                listWbSchedules(
                    where: $where
                    sort: $sort
                    limit: $limit
                    after: $after
                ) {
                    data {
                        ${WB_SCHEDULE_RECORD_FIELDS}
                    }
                    meta {
                        cursor
                        hasMoreItems
                        totalCount
                    }
                    error {
                        code
                        message
                        data
                    }
                }
            }
        }
    `;
};

interface WbSchedulerListGraphQLQueryVariables {
    where?: IWbSchedulerListExecuteParamsWhere;
    sort?: IWbSchedulerListExecuteParamsSort[];
    limit?: number;
    after?: string;
}

interface WbSchedulerListGraphQLQueryResponse {
    websiteBuilder: {
        listWbSchedules: {
            data: WbSchedulerEntry[] | null;
            meta: SchedulerMetaResponse | null;
            error: CmsErrorResponse | null;
        };
    };
}

const schema = zod.object({
    data: zod.array(wbSchedulerEntrySchema),
    meta: zod.object({
        totalCount: zod.number(),
        cursor: zod.string().nullable(),
        hasMoreItems: zod.boolean()
    })
});

export class WbSchedulerListGraphQLGateway implements IWbSchedulerListGateway {
    private readonly client: ApolloClient<any>;

    public constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    public async execute(
        params: IWbSchedulerListExecuteParams
    ): Promise<IWbSchedulerListGatewayResponse> {
        const { modelId, ...variables } = params;

        const { data: response, errors } = await this.client.query<
            WbSchedulerListGraphQLQueryResponse,
            WbSchedulerListGraphQLQueryVariables
        >({
            query: createWbSchedulerListQuery(),
            variables,
            fetchPolicy: "network-only"
        });

        const result = response.websiteBuilder.listWbSchedules;
        if (!result || errors?.length) {
            console.error({
                errors
            });
            throw new Error("Network error while listing WB scheduled entries.");
        }

        if (!result.data || !result.meta) {
            throw new Error(result.error?.message || "Could not fetch WB scheduled entries.");
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
