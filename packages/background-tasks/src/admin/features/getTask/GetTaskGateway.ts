import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { GetTaskGateway as GatewayAbstraction } from "./abstractions.js";
import type { Task } from "~/admin/shared/types.js";

const GET_TASK = /* GraphQL */ `
    query GetTask($id: ID!) {
        backgroundTasks {
            getTask(id: $id) {
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
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type GetTaskResponse = {
    backgroundTasks: {
        getTask:
            | { data: Task; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class GetTaskGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<Task> {
        const response = await this.client.execute<GetTaskResponse>({
            query: GET_TASK,
            variables: { id }
        });

        const envelope = response.backgroundTasks.getTask;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const GetTaskGateway = GatewayAbstraction.createImplementation({
    implementation: GetTaskGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
