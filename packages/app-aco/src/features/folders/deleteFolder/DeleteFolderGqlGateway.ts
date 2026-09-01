import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
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

export const DELETE_FOLDER = /* GraphQL */ `
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
        const response = await this.client.execute<DeleteFolderResponse, DeleteFolderVariables>({
            query: DELETE_FOLDER,
            variables: {
                id
            }
        });

        if (!response) {
            throw new Error("Network error while deleting folder");
        }

        const { data, error } = response.aco.deleteFolder;

        if (!data) {
            throw new Error(error?.message || "Could not delete folder");
        }

        return;
    }
}

export const DeleteFolderGqlGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteFolderGqlGatewayImpl,
    dependencies: [MainGraphQLClient]
});
