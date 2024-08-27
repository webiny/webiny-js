import { ApolloClient } from "apollo-client";
import { ICreateFolderGateway } from "./ICreateFolderGateway";
import { CREATE_FOLDER } from "~/graphql/folders.gql";
import { CreateFolderResponse, CreateFolderVariables } from "~/types";
import { CreateFolderGraphQLDTO } from "./ICreateFolderGraphQLMapper";

export class CreateFolderGraphQLGateway implements ICreateFolderGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(folder: CreateFolderGraphQLDTO) {
        const { data: response } = await this.client.mutate<
            CreateFolderResponse,
            CreateFolderVariables
        >({
            mutation: CREATE_FOLDER,
            variables: {
                data: {
                    ...folder
                }
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
