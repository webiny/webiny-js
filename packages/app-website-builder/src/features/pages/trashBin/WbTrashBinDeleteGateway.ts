import type { ITrashBinDeleteGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { TrashBinDeleteGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";

interface DeletePageErrorResponse {
    code: string;
    message: string;
    data?: unknown;
}

interface DeletePageResponse {
    websiteBuilder: {
        deletePage: {
            data: boolean | null;
            error: DeletePageErrorResponse | null;
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
                                data
                            }
                        }
                    }
                }
            `,
            variables: { id, permanently: true }
        });

        const { error } = response.websiteBuilder.deletePage;

        if (error) {
            throw new GraphQLOperationError({
                message: error.message || "Could not permanently delete the page.",
                code: error.code,
                data: error.data
            });
        }

        return true;
    }
}

export const WbTrashBinDeleteGateway = TrashBinDeleteGateway.createImplementation({
    implementation: WbTrashBinDeleteGatewayImpl,
    dependencies: [MainGraphQLClient]
});
