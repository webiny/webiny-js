import gql from "graphql-tag";
import { ApolloClient } from "@webiny/app-admin/features/apolloClient/abstraction.js";
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

export const DELETE_FOLDER = gql`
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
    constructor(private client: ApolloClient.Interface) {}

    async execute(id: string) {
        const { data: response } = await this.client.mutate<
            DeleteFolderResponse,
            DeleteFolderVariables
        >({
            mutation: DELETE_FOLDER,
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
    dependencies: [ApolloClient]
});
