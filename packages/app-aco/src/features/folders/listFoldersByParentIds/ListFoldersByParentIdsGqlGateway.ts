import gql from "graphql-tag";
import { ApolloClient } from "@webiny/app-admin/features/apolloClient/abstraction.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { RootFolder } from "~/domain/folder/RootFolder.js";
import { FolderModelProvider } from "~/features/folders/abstractions.js";
import { ListFoldersByParentIdsGateway as GatewayAbstraction } from "./abstractions.js";
import type { AcoError } from "~/types.js";

export interface ListFoldersByParentIdsResponse {
    aco: {
        listFolders: {
            data: FolderDto[] | null;
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

        return [RootFolder.create(), ...(data || [])];
    }
}

export const ListFoldersByParentIdsGqlGateway = GatewayAbstraction.createImplementation({
    implementation: ListFoldersByParentIdsGqlGatewayImpl,
    dependencies: [ApolloClient, FolderModelProvider]
});
