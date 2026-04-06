import gql from "graphql-tag";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { RootFolder } from "~/domain/folder/RootFolder.js";
import { FolderModelProvider } from "~/features/folders/abstractions.js";
import { ListFoldersGateway as GatewayAbstraction } from "./abstractions.js";
import type { AcoError } from "~/types.js";

export interface ListFoldersResponse {
    aco: {
        listFolders: {
            data: FolderDto[] | null;
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
        private client: MainGraphQLClient.Interface,
        private folderModelProvider: FolderModelProvider.Interface
    ) {}

    async execute(type: string) {
        const fields = await this.folderModelProvider.getGraphQLSelection();

        const response = await this.client.execute<ListFoldersResponse, ListFoldersQueryVariables>({
            query: LIST_FOLDERS(fields),
            variables: {
                type,
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

export const ListFoldersGqlGateway = GatewayAbstraction.createImplementation({
    implementation: ListFoldersGqlGatewayImpl,
    dependencies: [MainGraphQLClient, FolderModelProvider]
});
