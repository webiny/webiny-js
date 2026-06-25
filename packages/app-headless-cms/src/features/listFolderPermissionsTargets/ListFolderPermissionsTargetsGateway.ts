import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import type { FolderLevelPermissionsTarget } from "@webiny/app-aco";
import type { CmsErrorResponse } from "~/types.js";
import { ListFolderPermissionsTargetsGateway as GatewayAbstraction } from "./abstractions.js";

interface ListFolderPermissionsTargetsResponse {
    aco: {
        listFolderLevelPermissionsTargets: {
            data: FolderLevelPermissionsTarget[] | null;
            error: CmsErrorResponse | null;
        };
    };
}

const LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS = /* GraphQL */ `
    query ListFolderLevelPermissionsTargets {
        aco {
            listFolderLevelPermissionsTargets {
                data {
                    id
                    type
                    target
                    name
                    meta
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

class ListFolderPermissionsTargetsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<FolderLevelPermissionsTarget[]> {
        const response = await this.client.execute<ListFolderPermissionsTargetsResponse>({
            query: LIST_FOLDER_LEVEL_PERMISSIONS_TARGETS
        });

        const { data, error } = response.aco.listFolderLevelPermissionsTargets;

        if (!data) {
            throw new Error(error?.message || "Could not fetch folder permissions targets");
        }

        return data;
    }
}

export const ListFolderPermissionsTargetsGateway = GatewayAbstraction.createImplementation({
    implementation: ListFolderPermissionsTargetsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
