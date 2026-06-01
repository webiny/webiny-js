import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse } from "~/types.js";
import { createUnpublishMutation } from "@webiny/app-headless-cms-common";
import {
    UnpublishEntryGateway as GatewayAbstraction,
    type IUnpublishEntryParams
} from "./abstractions.js";

interface UnpublishEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

class UnpublishEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, revisionId }: IUnpublishEntryParams) {
        const mutation = createUnpublishMutation(model);

        const response = await this.client.execute<UnpublishEntryResponse>({
            query: mutation,
            variables: { revision: revisionId }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not unpublish entry");
        }

        return data;
    }
}

export const UnpublishEntryGateway = GatewayAbstraction.createImplementation({
    implementation: UnpublishEntryGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
