import { ApolloClient } from "apollo-client";
import { IGetFolderGateway } from "./IGetFolderGateway";
import { GET_FOLDER } from "~/graphql/folders.gql";
import { FolderItem, AcoError } from "~/types";

export interface GetFolderResponse {
    aco: {
        getFolder: {
            data: FolderItem | null;
            error: AcoError | null;
        };
    };
}

export interface GetFolderQueryVariables {
    id: string;
}

export class GetFolderGraphQLGateway implements IGetFolderGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(id: string) {
        if (!id) {
            throw new Error("Folder `id` is mandatory");
        }

        const { data: response } = await this.client.query<
            GetFolderResponse,
            GetFolderQueryVariables
        >({
            query: GET_FOLDER,
            variables: { id },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while fetch folder.");
        }

        const { data, error } = response.aco.getFolder;

        if (!data) {
            throw new Error(error?.message || `Could not fetch folder with id: ${id}`);
        }

        return data;
    }
}
