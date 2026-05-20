import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { AbortTaskGateway as GatewayAbstraction, type IAbortTaskInput } from "./abstractions.js";
import type { Task } from "~/admin/shared/types.js";

const ABORT_TASK = /* GraphQL */ `
    mutation AbortTask($id: ID!, $message: String) {
        backgroundTasks {
            abortTask(id: $id, message: $message) {
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

type AbortTaskResponse = {
    backgroundTasks: {
        abortTask:
            | { data: Task; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class AbortTaskGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(input: IAbortTaskInput): Promise<Task> {
        const response = await this.client.execute<AbortTaskResponse>({
            query: ABORT_TASK,
            variables: { id: input.id, message: input.message }
        });

        const envelope = response.backgroundTasks.abortTask;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const AbortTaskGateway = GatewayAbstraction.createImplementation({
    implementation: AbortTaskGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
