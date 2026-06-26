import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { FolderModelProvider } from "~/features/folders/abstractions.js";
import { GetFolderGateway as GatewayAbstraction } from "./abstractions.js";
import type { AcoError } from "~/types.js";

export interface GetFolderResponse {
    aco: {
        getFolder:
            | {
                  data: FolderDto;
                  error: null;
              }
            | {
                  data: null;
                  error: AcoError;
              };
    };
}

export interface GetFolderQueryVariables {
    id: string;
}

class GetFolderGqlGatewayImpl implements GatewayAbstraction.Interface {
    constructor(
        private client: MainGraphQLClient.Interface,
        private folderModelProvider: FolderModelProvider.Interface
    ) {}

    async execute(id: string) {
        const fields = await this.folderModelProvider.getGraphQLSelection();

        const query = /* GraphQL */ `
            query GetFolder($id: ID!) {
                aco {
                    getFolder(id: $id) {
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

        const response = await this.client.execute<GetFolderResponse>({
            query,
            variables: { id }
        });

        const { data, error } = response.aco.getFolder;

        if (!data) {
            throw new Error(error?.message || `Could not fetch folder with id: ${id}`);
        }

        return data;
    }
}

export const GetFolderGqlGateway = GatewayAbstraction.createImplementation({
    implementation: GetFolderGqlGatewayImpl,
    dependencies: [MainGraphQLClient, FolderModelProvider]
});
