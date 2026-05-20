import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import {
    ListLogsGateway as GatewayAbstraction,
    type IListLogsInput,
    type IListLogsOutput
} from "./abstractions.js";
import type { TaskLog } from "~/admin/shared/types.js";

const LIST_LOGS = /* GraphQL */ `
    query ListBackgroundTaskLogs(
        $where: WebinyBackgroundTaskLogListWhereInput
        $sort: [WebinyBackgroundTaskLogListSorter!]
        $limit: Int
        $after: String
    ) {
        backgroundTasks {
            listLogs(where: $where, sort: $sort, limit: $limit, after: $after) {
                data {
                    id
                    createdOn
                    executionName
                    iteration
                    items {
                        message
                        createdOn
                        type
                        data
                        error
                    }
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

type ListLogsResponse = {
    backgroundTasks: {
        listLogs:
            | {
                  data: TaskLog[];
                  meta: { cursor: string | null; hasMoreItems: boolean; totalCount: number };
                  error: null;
              }
            | {
                  data: null;
                  meta: null;
                  error: { code: string; message: string; data: unknown };
              };
    };
};

class ListLogsGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(input: IListLogsInput): Promise<IListLogsOutput> {
        const response = await this.client.execute<ListLogsResponse>({
            query: LIST_LOGS,
            variables: {
                where: input.where,
                sort: input.sort,
                limit: input.limit,
                after: input.after
            }
        });

        const envelope = response.backgroundTasks.listLogs;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return {
            items: envelope.data,
            meta: envelope.meta
        };
    }
}

export const ListLogsGateway = GatewayAbstraction.createImplementation({
    implementation: ListLogsGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
