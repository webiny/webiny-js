import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse } from "~/types.js";
import { createUpdateSingletonMutation } from "@webiny/app-headless-cms-common";
import {
    UpdateSingletonEntryGateway as GatewayAbstraction,
    type IUpdateSingletonEntryParams
} from "./abstractions.js";

interface UpdateSingletonEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

class UpdateSingletonEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, data, options }: IUpdateSingletonEntryParams) {
        const mutation = createUpdateSingletonMutation(model);

        const response = await this.client.execute<UpdateSingletonEntryResponse>({
            query: mutation,
            variables: { data, options }
        });

        const { data: entry, error } = response.content;

        if (!entry) {
            throw new Error(error?.message || "Could not update singleton entry");
        }

        return entry;
    }
}

export const UpdateSingletonEntryGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateSingletonEntryGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
