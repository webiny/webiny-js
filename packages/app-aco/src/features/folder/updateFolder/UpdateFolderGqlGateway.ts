import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IUpdateFolderGateway } from "./IUpdateFolderGateway";
import { FolderDto } from "./FolderDto";
import { AcoError, FolderItem } from "~/types";
import { ROOT_FOLDER } from "~/constants";

export interface UpdateFolderResponse {
    aco: {
        updateFolder: {
            data: FolderItem;
            error: AcoError | null;
        };
    };
}

export interface UpdateFolderVariables {
    id: string;
    data: Partial<
        Omit<
            FolderItem,
            "id" | "createdOn" | "createdBy" | "savedOn" | "savedBy" | "modifiedOn" | "modifiedBy"
        >
    >;
}

export const UPDATE_FOLDER = gql`
    mutation UpdateFolder($id: ID!, $data: FolderUpdateInput!) {
        aco {
            updateFolder(id: $id, data: $data) {
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

export class UpdateFolderGqlGateway implements IUpdateFolderGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(folder: FolderDto) {
        const { id, title, slug, permissions, parentId } = folder;

        const { data: response } = await this.client.mutate<
            UpdateFolderResponse,
            UpdateFolderVariables
        >({
            mutation: UPDATE_FOLDER,
            variables: {
                id,
                data: {
                    title,
                    slug,
                    parentId: parentId === ROOT_FOLDER ? null : parentId,
                    permissions: permissions.filter(p => !p.inheritedFrom)
                }
            }
        });

        if (!response) {
            throw new Error("Network error while updating folder.");
        }

        const { data, error } = response.aco.updateFolder;

        if (!data) {
            throw new Error(error?.message || "Could not update folder");
        }

        return;
    }
}
