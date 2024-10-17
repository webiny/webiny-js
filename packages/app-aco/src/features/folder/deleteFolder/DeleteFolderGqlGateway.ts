import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IDeleteFolderGateway } from "./IDeleteFolderGateway";
import { AcoError } from "~/types";

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

export class DeleteFolderGqlGateway implements IDeleteFolderGateway {
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
