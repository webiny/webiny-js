import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
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

export const UPDATE_FOLDER = (FOLDER_FIELDS: string) => /* GraphQL */ `
    mutation UpdateFolder($id: ID!, $data: FolderUpdateInput!) {
        aco {
            updateFolder(id: $id, data: $data) {
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

class UpdateFolderGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: MainGraphQLClient.Interface,
        private folderModelProvider: FolderModelProvider.Interface
    ) {}

    async execute(folder: FolderGatewayDto) {
        const fields = await this.folderModelProvider.getGraphQLSelection();

        const { id, title, slug, permissions, parentId, extensions } = folder;

        const response = await this.client.execute<UpdateFolderResponse, UpdateFolderVariables>({
            query: UPDATE_FOLDER(fields),
            variables: {
                id,
                data: {
                    title,
                    slug,
                    extensions,
                    parentId: parentId === ROOT_FOLDER ? null : parentId,
                    permissions: permissions.filter(p => !p.inheritedFrom && !p.plugin)
                }
            }
        });

        if (!response) {
            throw new Error("Network error while updating folder.");
        }

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
