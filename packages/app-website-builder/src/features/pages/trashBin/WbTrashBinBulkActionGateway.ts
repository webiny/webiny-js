import type {
    ITrashBinBulkActionGateway,
    ITrashBinBulkActionParams,
    ITrashBinBulkActionResult
} from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { TrashBinBulkActionGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

interface BulkActionsResponse {
    websiteBuilder: {
        bulkActions: {
            data: { id: string } | null;
            error: { code: string; message: string } | null;
        };
    };
}

class WbTrashBinBulkActionGatewayImpl implements ITrashBinBulkActionGateway {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(params: ITrashBinBulkActionParams): Promise<ITrashBinBulkActionResult> {
        const response = await this.client.execute<BulkActionsResponse>({
            query: `
                mutation WbBulkActions($action: WbBulkActionsInput!) {
                    websiteBuilder {
                        bulkActions(action: $action) {
                            data {
                                id
                            }
                            error {
                                code
                                message
                            }
                        }
                    }
                }
            `,
            variables: { action: params }
        });

        const { data, error } = response.websiteBuilder.bulkActions;

        if (error || !data) {
            throw new Error(error?.message || "Could not perform the bulk action.");
        }

        return data;
    }
}

export const WbTrashBinBulkActionGateway = TrashBinBulkActionGateway.createImplementation({
    implementation: WbTrashBinBulkActionGatewayImpl,
    dependencies: [MainGraphQLClient]
});
