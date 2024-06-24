import { ApolloClient } from "apollo-client";
import { IDeleteFolderGateway } from "./IDeleteFolderGateway";
import { DeleteFolderResponse, DeleteFolderVariables } from "~/types";
import { DELETE_FOLDER } from "~/graphql/folders.gql";

export class DeleteFolderGraphQLGateway implements IDeleteFolderGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

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
