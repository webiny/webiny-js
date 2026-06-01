import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse } from "~/types.js";
import { createPublishMutation } from "@webiny/app-headless-cms-common";
import {
    PublishEntryGateway as GatewayAbstraction,
    type IPublishEntryParams
} from "./abstractions.js";

interface PublishEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

class PublishEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, revisionId }: IPublishEntryParams) {
        const mutation = createPublishMutation(model);

        const response = await this.client.execute<PublishEntryResponse>({
            query: mutation,
            variables: { revision: revisionId }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not publish entry");
        }

        return data;
    }
}

export const PublishEntryGateway = GatewayAbstraction.createImplementation({
    implementation: PublishEntryGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
