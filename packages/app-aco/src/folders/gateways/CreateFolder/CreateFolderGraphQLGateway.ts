import { ApolloClient } from "apollo-client";
import { ICreateFolderGateway } from "./ICreateFolderGateway";
import { CreateFolderGraphQLDTO } from "./ICreateFolderGraphQLMapper";
import { CREATE_FOLDER } from "~/graphql/folders.gql";
import { AcoError, FolderItem } from "~/types";

export interface CreateFolderResponse {
    aco: {
        createFolder: {
            data: FolderItem;
            error: AcoError | null;
        };
    };
}

export interface CreateFolderVariables {
    data: Omit<
        FolderItem,
        | "id"
        | "createdOn"
        | "createdBy"
        | "savedOn"
        | "savedBy"
        | "modifiedOn"
        | "modifiedBy"
        | "hasNonInheritedPermissions"
        | "canManageContent"
        | "canManagePermissions"
        | "canManageStructure"
    >;
}

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
