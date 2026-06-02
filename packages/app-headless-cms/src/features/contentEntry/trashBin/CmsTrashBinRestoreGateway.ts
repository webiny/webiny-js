import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse } from "~/types.js";
import { createRestoreFromBinMutation } from "@webiny/app-headless-cms-common";
import {
    CmsTrashBinRestoreGateway as GatewayAbstraction,
    type ICmsTrashBinRestoreGatewayParams
} from "./abstractions.js";

interface RestoreEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

class CmsTrashBinRestoreGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, id }: ICmsTrashBinRestoreGatewayParams): Promise<CmsContentEntry> {
        const mutation = createRestoreFromBinMutation(model);

        const response = await this.client.execute<RestoreEntryResponse>({
            query: mutation,
            variables: { revision: id }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not restore the entry from trash bin.");
        }

        return data;
    }
}

export const CmsTrashBinRestoreGateway = GatewayAbstraction.createImplementation({
    implementation: CmsTrashBinRestoreGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
