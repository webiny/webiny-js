import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
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

class CreateFolderGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: MainGraphQLClient.Interface,
        private folderModelProvider: FolderModelProvider.Interface
    ) {}

    async execute(folder: FolderGatewayDto) {
        const fields = await this.folderModelProvider.getGraphQLSelection();

        const query = /* GraphQL */ `
            mutation CreateFolder($data: FolderCreateInput!) {
                aco {
                    createFolder(data: $data) {
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

        const response = await this.client.execute<CreateFolderResponse>({
            query,
            variables: {
                data: {
                    ...folder
                }
            }
        });

        const { data, error } = response.aco.createFolder;

        if (!data) {
            throw new Error(error?.message || "Could not create folder");
        }

        return data;
    }
}

export const CreateFolderGqlGateway = GatewayAbstraction.createImplementation({
    implementation: CreateFolderGqlGatewayImpl,
    dependencies: [MainGraphQLClient, FolderModelProvider]
});
