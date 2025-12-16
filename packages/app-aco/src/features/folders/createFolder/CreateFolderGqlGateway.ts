import gql from "graphql-tag";
import { ApolloClient } from "@webiny/app-admin/features/apolloClient/abstraction.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { FolderModelProvider } from "~/features/folders/abstractions.js";
import type { FolderGatewayDto } from "./abstractions.js";
import { CreateFolderGateway as GatewayAbstraction } from "./abstractions.js";
import type { AcoError } from "~/types.js";

export interface CreateFolderResponse {
    aco: {
        createFolder: {
            data: FolderDto;
            error: AcoError | null;
        };
    };
}

export interface CreateFolderVariables {
    data: Omit<
        FolderDto,
        | "id"
        | "path"
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

export const CREATE_FOLDER = (FOLDER_FIELDS: string) => gql`
        mutation CreateFolder($data: FolderCreateInput!) {
            aco {
                createFolder(data: $data) {
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

class CreateFolderGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: ApolloClient.Interface,
        private folderModelProvider: FolderModelProvider.Interface
    ) {}

    async execute(folder: FolderGatewayDto) {
        const fields = await this.folderModelProvider.getGraphQLSelection();

        const { data: response } = await this.client.mutate<
            CreateFolderResponse,
            CreateFolderVariables
        >({
            mutation: CREATE_FOLDER(fields),
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

export const CreateFolderGqlGateway = GatewayAbstraction.createImplementation({
    implementation: CreateFolderGqlGatewayImpl,
    dependencies: [ApolloClient, FolderModelProvider]
});
