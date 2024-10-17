import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { ICreateFolderGateway } from "./ICreateFolderGateway";
import { FolderDto } from "./FolderDto";
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

export const CREATE_FOLDER = gql`
    mutation CreateFolder($data: FolderCreateInput!) {
        aco {
            createFolder(data: $data) {
                data {
                    id
                    title
                    slug
                    permissions {
                        target
                        level
                        inheritedFrom
                    }
                    hasNonInheritedPermissions
                    canManagePermissions
                    canManageStructure
                    canManageContent
                    parentId
                    type
                    savedOn
                    savedBy {
                        id
                        displayName
                    }
                    createdOn
                    createdBy {
                        id
                        displayName
                    }
                    modifiedOn
                    modifiedBy {
                        id
                        displayName
                    }
                }
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

export class CreateFolderGqlGateway implements ICreateFolderGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(folder: FolderDto) {
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
