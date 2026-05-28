import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import {
    ListTasksGateway as GatewayAbstraction,
    type IListTasksInput,
    type IListTasksOutput
} from "./abstractions.js";
import type { Task } from "~/admin/shared/types.js";

const LIST_TASKS = /* GraphQL */ `
    query ListTasks(
        $where: WebinyBackgroundTaskListWhereInput
        $sort: [WebinyBackgroundTaskListSorter!]
        $limit: Int
        $after: String
        $search: String
    ) {
        backgroundTasks {
            listTasks(where: $where, sort: $sort, limit: $limit, after: $after, search: $search) {
                data {
                    id
                    createdOn
                    savedOn
                    createdBy {
                        id
                        displayName
                        type
                    }
                    name
                    definitionId
                    parentId
                    executionName
                    iterations
                    input
                    output
                    taskStatus
                    startedOn
                    finishedOn
                    eventResponse
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

type ListTasksResponse = {
    backgroundTasks: {
        listTasks:
            | {
                  data: Task[];
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

class ListTasksGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(input: IListTasksInput): Promise<IListTasksOutput> {
        const response = await this.client.execute<ListTasksResponse>({
            query: LIST_TASKS,
            variables: {
                where: input.where,
                sort: input.sort,
                limit: input.limit,
                after: input.after,
                search: input.search
            }
        });

        const envelope = response.backgroundTasks.listTasks;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return {
            items: envelope.data,
            meta: envelope.meta
        };
    }
}

export const ListTasksGateway = GatewayAbstraction.createImplementation({
    implementation: ListTasksGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
