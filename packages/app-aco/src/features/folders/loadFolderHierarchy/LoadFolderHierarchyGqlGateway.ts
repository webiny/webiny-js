import gql from "graphql-tag";
import { ApolloClient } from "@webiny/app-admin/features/apolloClient/abstraction.js";
import { FoldersContext } from "~/features/folders/abstractions.js";
import { LoadFolderHierarchyGateway as GatewayAbstraction } from "./abstractions.js";
import type { AcoError, FolderItem } from "~/types.js";
import { ROOT_FOLDER } from "~/constants.js";

interface LoadFolderHierarchyResponseData {
    parents: FolderItem[];
    siblings: FolderItem[];
}

export interface LoadFolderHierarchyResponse {
    aco: {
        getFolderHierarchy: {
            data: LoadFolderHierarchyResponseData | null;
            error: AcoError | null;
        };
    };
}

export interface LoadFolderHierarchyQueryVariables {
    type: string;
    id: string;
}

export const LOAD_FOLDER_HIERARCHY = (FOLDER_FIELDS: string) => gql`
    query GetFolderHierarchy($type: String!, $id: ID!) {
        aco {
            getFolderHierarchy(type: $type, id: $id) {
                data {
                    parents ${FOLDER_FIELDS}
                    siblings ${FOLDER_FIELDS}
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

class LoadFolderHierarchyGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: ApolloClient.Interface,
        private foldersContext: FoldersContext.Interface
    ) {}

    async execute(type: string, id: string) {
        const { data: response } = await this.client.query<
            LoadFolderHierarchyResponse,
            LoadFolderHierarchyQueryVariables
        >({
            query: LOAD_FOLDER_HIERARCHY(this.foldersContext.modelFields),
            variables: {
                type,
                id
            },
            fetchPolicy: "network-only"
        });

        if (!response) {
            throw new Error(
                `Network error while loading folder hierarchy for the provided type/id: ${type}/${id}.`
            );
        }

        const { data, error } = response.aco.getFolderHierarchy;

        if (!data) {
            throw new Error(
                error?.message ||
                    `Could not load folder hierarchy for the provided type/id: ${type}/${id}.`
            );
        }

        return {
            parents: [this.getRootFolder(), ...data.parents],
            siblings: data.siblings
        };
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

export const LoadFolderHierarchyGqlGateway = GatewayAbstraction.createImplementation({
    implementation: LoadFolderHierarchyGqlGatewayImpl,
    dependencies: [ApolloClient, FoldersContext]
});
