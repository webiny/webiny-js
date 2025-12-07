import gql from "graphql-tag";
import { ApolloClient } from "@webiny/app-admin/features/apolloClient/abstraction.js";
import { FolderModelProvider } from "~/features/folders/abstractions.js";
import { ListFoldersGateway as GatewayAbstraction } from "./abstractions.js";
import type { AcoError, FolderItem } from "~/types.js";
import { ROOT_FOLDER } from "~/constants.js";

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

export const LIST_FOLDERS = (FOLDER_FIELDS: string) => gql`
    query ListFolders($type: String!, $limit: Int!) {
        aco {
            listFolders(where: { type: $type }, limit: $limit) {
                data ${FOLDER_FIELDS}
                error {
                    code
                    data
                    message
                }
            }
        }
    }
`;

class ListFoldersGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: ApolloClient.Interface,
        private folderModelProvider: FolderModelProvider.Interface
    ) {}

    async execute(type: string) {
        const fields = await this.folderModelProvider.getGraphQLSelection();

        const { data: response } = await this.client.query<
            ListFoldersResponse,
            ListFoldersQueryVariables
        >({
            query: LIST_FOLDERS(fields),
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
            path: ROOT_FOLDER,
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
            type: "$ROOT",
            extensions: {}
        };
    }
}

export const ListFoldersGqlGateway = GatewayAbstraction.createImplementation({
    implementation: ListFoldersGqlGatewayImpl,
    dependencies: [ApolloClient, FolderModelProvider]
});
