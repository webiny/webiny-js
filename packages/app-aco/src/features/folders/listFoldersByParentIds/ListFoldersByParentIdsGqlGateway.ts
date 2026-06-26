import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
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

class ListFoldersByParentIdsGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: MainGraphQLClient.Interface,
        private folderModelProvider: FolderModelProvider.Interface
    ) {}

    async execute(type: string, parentIds: string[]) {
        const fields = await this.folderModelProvider.getGraphQLSelection();

        const query = /* GraphQL */ `
            query ListFoldersByParentIds($type: String!, $parentIds_in: [ID!]!, $limit: Int!) {
                aco {
                    listFolders(where: { type: $type, parentId_in: $parentIds_in }, limit: $limit) {
                        data ${fields}
                        error {
                            code
                            data
                            message
                        }
                    }
                }
            }
        `;

        const response = await this.client.execute<ListFoldersByParentIdsResponse>({
            query,
            variables: {
                type,
                parentIds_in: parentIds,
                limit: 10000
            }
        });

        const { data, error } = response.aco.listFolders;

        if (!data) {
            throw new Error(error?.message || "Could not fetch folders");
        }

        return [RootFolder.create(), ...(data || [])];
    }
}

export const ListFoldersByParentIdsGqlGateway = GatewayAbstraction.createImplementation({
    implementation: ListFoldersByParentIdsGqlGatewayImpl,
    dependencies: [MainGraphQLClient, FolderModelProvider]
});
