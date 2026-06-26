import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { DeleteFolderGateway as GatewayAbstraction } from "./abstractions.js";
import type { AcoError } from "~/types.js";

export interface DeleteFolderVariables {
    id: string;
}

export interface DeleteFolderResponse {
    aco: {
        deleteFolder: {
            data: boolean;
            error: AcoError | null;
        };
    };
}

const DELETE_FOLDER = /* GraphQL */ `
    mutation DeleteFolder($id: ID!) {
        aco {
            deleteFolder(id: $id) {
                data
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

class DeleteFolderGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string) {
        const response = await this.client.execute<DeleteFolderResponse>({
            query: DELETE_FOLDER,
            variables: { id }
        });

        const { data, error } = response.aco.deleteFolder;

        if (!data) {
            throw new Error(error?.message || "Could not delete folder");
        }
    }
}

export const DeleteFolderGqlGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteFolderGqlGatewayImpl,
    dependencies: [MainGraphQLClient]
});
