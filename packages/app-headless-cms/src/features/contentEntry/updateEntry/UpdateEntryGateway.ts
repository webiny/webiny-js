import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse } from "~/types.js";
import { createUpdateMutation } from "@webiny/app-headless-cms-common";
import {
    UpdateEntryGateway as GatewayAbstraction,
    type IUpdateEntryParams
} from "./abstractions.js";

interface UpdateEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

class UpdateEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, revisionId, data, options }: IUpdateEntryParams) {
        const mutation = createUpdateMutation(model);

        const response = await this.client.execute<UpdateEntryResponse>({
            query: mutation,
            variables: { revision: revisionId, data, options }
        });

        const { data: entry, error } = response.content;

        if (!entry) {
            throw new Error(error?.message || "Could not update entry");
        }

        return entry;
    }
}

export const UpdateEntryGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateEntryGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
