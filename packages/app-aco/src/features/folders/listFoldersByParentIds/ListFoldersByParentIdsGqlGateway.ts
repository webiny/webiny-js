import gql from "graphql-tag";
import { ApolloClient } from "@webiny/app-admin/features/apolloClient/abstraction.js";
import { FolderModelProvider } from "~/features/folders/abstractions.js";
import { ListFoldersByParentIdsGateway as GatewayAbstraction } from "./abstractions.js";
import type { AcoError, FolderItem } from "~/types.js";
import { ROOT_FOLDER } from "~/constants.js";

export interface ListFoldersByParentIdsResponse {
    aco: {
        listFolders: {
            data: FolderItem[] | null;
            error: AcoError | null;
        };
    };
}

export interface ListFoldersByParentIdsQueryVariables {
    type: string;
    parentIds_in: string[];
    limit: number;
    sort?: Record<string, any>;
    after?: string | null;
}

export const LIST_FOLDERS_BY_PARENT_IDS = (FOLDER_FIELDS: string) => gql`
    query ListFoldersByParentIds($type: String!, $parentIds_in: [ID!]!, $limit: Int!) {
        aco {
            listFolders(where: { type: $type, parentId_in: $parentIds_in }, limit: $limit) {
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

class ListFoldersByParentIdsGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: ApolloClient.Interface,
        private folderModelProvider: FolderModelProvider.Interface
    ) {}

    async execute(type: string, parentIds: string[]) {
        const fields = await this.folderModelProvider.getGraphQLSelection();

        const { data: response } = await this.client.query<
            ListFoldersByParentIdsResponse,
            ListFoldersByParentIdsQueryVariables
        >({
            query: LIST_FOLDERS_BY_PARENT_IDS(fields),
            variables: {
                type,
                parentIds_in: parentIds,
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

export const ListFoldersByParentIdsGqlGateway = GatewayAbstraction.createImplementation({
    implementation: ListFoldersByParentIdsGqlGatewayImpl,
    dependencies: [ApolloClient, FolderModelProvider]
});
