import type {
    ITrashBinRestoreGateway,
    TrashBinItem
} from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { TrashBinRestoreGateway } from "@webiny/app-admin/presentation/trashBin/abstractions.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient";
import { TRASH_PAGE_FIELDS, toTrashBinItem, type TrashPageDto } from "./shared.js";

interface RestorePageResponse {
    websiteBuilder: {
        restorePage: {
            data: TrashPageDto | null;
            error: { code: string; message: string } | null;
        };
    };
}

class WbTrashBinRestoreGatewayImpl implements ITrashBinRestoreGateway {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(id: string): Promise<TrashBinItem> {
        const response = await this.client.execute<RestorePageResponse>({
            query: `
                mutation WbRestorePage($id: ID!) {
                    websiteBuilder {
                        restorePage(id: $id) {
                            data {
                                ${TRASH_PAGE_FIELDS}
                            }
                            error {
                                code
                                message
                            }
                        }
                    }
                }
            `,
            variables: { id }
        });

        const { data, error } = response.websiteBuilder.restorePage;

        if (error || !data) {
            throw new Error(error?.message || "Could not restore the page.");
        }

        return toTrashBinItem(data);
    }
}

export const WbTrashBinRestoreGateway = TrashBinRestoreGateway.createImplementation({
    implementation: WbTrashBinRestoreGatewayImpl,
    dependencies: [MainGraphQLClient]
});
