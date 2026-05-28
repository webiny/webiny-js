import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { ListDefinitionsGateway as GatewayAbstraction } from "./abstractions.js";
import type { TaskDefinition } from "~/admin/shared/types.js";

const LIST_DEFINITIONS = /* GraphQL */ `
    query ListTaskDefinitions {
        backgroundTasks {
            listDefinitions {
                data {
                    id
                    title
                    description
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

type ListDefinitionsResponse = {
    backgroundTasks: {
        listDefinitions:
            | { data: TaskDefinition[]; error: null }
            | { data: null; error: { code: string; message: string; data: unknown } };
    };
};

class ListDefinitionsGraphQLGateway implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<TaskDefinition[]> {
        const response = await this.client.execute<ListDefinitionsResponse>({
            query: LIST_DEFINITIONS
        });

        const envelope = response.backgroundTasks.listDefinitions;
        if (envelope.error) {
            throw new Error(envelope.error.message);
        }

        return envelope.data;
    }
}

export const ListDefinitionsGateway = GatewayAbstraction.createImplementation({
    implementation: ListDefinitionsGraphQLGateway,
    dependencies: [MainGraphQLClient]
});
