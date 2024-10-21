import ApolloClient from "apollo-client";
import gql from "graphql-tag";
import { IListFoldersGateway } from "./IListFoldersGateway";
import { AcoError, FolderItem } from "~/types";
import { ROOT_FOLDER } from "~/constants";

export interface ListFoldersResponse {
    aco: {
        listFolders: {
            data: FolderItem[] | null;
            error: AcoError | null;
        };
    };
}

export interface ListFoldersQueryVariables {
    type: string;
    limit: number;
    sort?: Record<string, any>;
    after?: string | null;
}

export const LIST_FOLDERS = gql`
    query ListFolders($type: String!, $limit: Int!) {
        aco {
            listFolders(where: { type: $type }, limit: $limit) {
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

export class ListFoldersGqlGateway implements IListFoldersGateway {
    private client: ApolloClient<any>;

    constructor(client: ApolloClient<any>) {
        this.client = client;
    }

    async execute(type: string) {
        const { data: response } = await this.client.query<
            ListFoldersResponse,
            ListFoldersQueryVariables
        >({
            query: LIST_FOLDERS,
            variables: {
                type,
                limit: 10000
            },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error("Network error while listing folders.");
        }

        const { data, error } = response.aco.listFolders;

        if (!data) {
            throw new Error(error?.message || "Could not fetch folders");
        }

        return [this.getRootFolder(), ...(data || [])];
    }

    private getRootFolder(): FolderItem {
        return {
            id: ROOT_FOLDER,
            title: "Home",
            permissions: [],
            parentId: "0",
            slug: "",
            createdOn: "",
            createdBy: {
                id: "",
                displayName: "",
                type: ""
            },
            hasNonInheritedPermissions: false,
            canManagePermissions: true,
            canManageStructure: true,
            canManageContent: true,
            savedOn: "",
            savedBy: {
                id: "",
                displayName: "",
                type: ""
            },
            modifiedOn: null,
            modifiedBy: null,
            type: "$ROOT"
        };
    }
}
