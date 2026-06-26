import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { FolderModelProvider } from "~/features/folders/abstractions.js";
import type { FolderGatewayDto } from "./abstractions.js";
import { UpdateFolderGateway as GatewayAbstraction } from "./abstractions.js";
import type { AcoError } from "~/types.js";
import { ROOT_FOLDER } from "~/constants.js";

export interface UpdateFolderResponse {
    aco: {
        updateFolder: {
            data: FolderDto;
            error: AcoError | null;
        };
    };
}

export interface UpdateFolderVariables {
    id: string;
    data: Partial<
        Omit<
            FolderDto,
            "id" | "createdOn" | "createdBy" | "savedOn" | "savedBy" | "modifiedOn" | "modifiedBy"
        >
    >;
}

class UpdateFolderGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: MainGraphQLClient.Interface,
        private folderModelProvider: FolderModelProvider.Interface
    ) {}

    async execute(folder: FolderGatewayDto) {
        const fields = await this.folderModelProvider.getGraphQLSelection();

        const query = /* GraphQL */ `
            mutation UpdateFolder($id: ID!, $data: FolderUpdateInput!) {
                aco {
                    updateFolder(id: $id, data: $data) {
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

        const { id, title, slug, permissions, parentId, extensions } = folder;

        const response = await this.client.execute<UpdateFolderResponse>({
            query,
            variables: {
                id,
                data: {
                    title,
                    slug,
                    extensions,
                    parentId: parentId === ROOT_FOLDER ? null : parentId,
                    permissions: permissions.filter(p => !p.inheritedFrom)
                }
            }
        });

        const { data, error } = response.aco.updateFolder;

        if (!data) {
            throw new Error(error?.message || "Could not update folder");
        }

        return data;
    }
}

export const UpdateFolderGqlGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateFolderGqlGatewayImpl,
    dependencies: [MainGraphQLClient, FolderModelProvider]
});
