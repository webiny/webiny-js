import type { ITrashBinDeleteGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { TrashBinDeleteGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

interface DeletePageResponse {
    websiteBuilder: {
        deletePage: {
            data: boolean | null;
            error: { code: string; message: string } | null;
        };
    };
}

class WbTrashBinDeleteGatewayImpl implements ITrashBinDeleteGateway {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<boolean> {
        const response = await this.client.execute<DeletePageResponse>({
            query: `
                mutation WbPermanentlyDeletePage($id: ID!, $permanently: Boolean!) {
                    websiteBuilder {
                        deletePage(id: $id, permanently: $permanently) {
                            data
                            error {
                                code
                                message
                            }
                        }
                    }
                }
            `,
            variables: { id, permanently: true }
        });

        const { error } = response.websiteBuilder.deletePage;

        if (error) {
            throw new Error(error.message || "Could not permanently delete the page.");
        }

        return true;
    }
}

export const WbTrashBinDeleteGateway = TrashBinDeleteGateway.createImplementation({
    implementation: WbTrashBinDeleteGatewayImpl,
    dependencies: [MainGraphQLClient]
});
