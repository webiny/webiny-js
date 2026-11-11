import type {
    ITrashBinBulkActionGateway,
    ITrashBinBulkActionParams,
    ITrashBinBulkActionResult
} from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { TrashBinBulkActionGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

interface BulkActionsErrorResponse {
    code: string;
    message: string;
    data?: unknown;
}

interface BulkActionsResponse {
    websiteBuilder: {
        bulkActions: {
            data: { id: string } | null;
            error: BulkActionsErrorResponse | null;
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
                                data
                            }
                        }
                    }
                }
            `,
            variables: { action: params }
        });

        const { data, error } = response.websiteBuilder.bulkActions;

        if (error || !data) {
            throw new GraphQLOperationError({
                message: error?.message || "Could not perform the bulk action.",
                code: error?.code,
                data: error?.data
            });
        }

        return data;
    }
}

export const WbTrashBinBulkActionGateway = TrashBinBulkActionGateway.createImplementation({
    implementation: WbTrashBinBulkActionGatewayImpl,
    dependencies: [MainGraphQLClient]
});
