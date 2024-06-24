import { ApolloClient } from "apollo-client";
import { ICreateFolderGateway } from "./ICreateFolderGateway";
import { CreateFolderFtaResponse, CreateFolderFtaVariables } from "~/types";
import { CREATE_FOLDER } from "~/graphql/folders.gql";
import { FolderDTO } from "~/Domain/Models";

export class CreateFolderGraphQLGateway implements ICreateFolderGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(folder: FolderDTO) {
        const { data: response } = await this.client.mutate<
            CreateFolderFtaResponse,
            CreateFolderFtaVariables
        >({
            mutation: CREATE_FOLDER,
            variables: {
                data: folder
            }
        });

        if (!response) {
            throw new Error("Network error while creating folder.");
        }

        const { data, error } = response.aco.createFolder;

        if (!data) {
            throw new Error(error?.message || "Could not create folder");
        }

        return data;
    }
}
