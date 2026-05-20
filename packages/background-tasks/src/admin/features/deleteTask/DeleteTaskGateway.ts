import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { DeleteTaskGateway as GatewayAbstraction } from "./abstractions.js";

const DELETE_TASK = /* GraphQL */ `
    mutation DeleteTask($id: ID!) {
        backgroundTasks {
            deleteTask(id: $id) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

type DeleteTaskResponse = {
    backgroundTasks: {
        deleteTask:
            | { data: boolean; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class DeleteTaskGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<boolean> {
        const response = await this.client.execute<DeleteTaskResponse>({
            query: DELETE_TASK,
            variables: { id }
        });

        const envelope = response.backgroundTasks.deleteTask;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const DeleteTaskGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteTaskGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
