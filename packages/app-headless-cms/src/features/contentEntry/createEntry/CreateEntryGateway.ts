import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse } from "~/types.js";
import { createCreateMutation } from "@webiny/app-headless-cms-common";
import {
    CreateEntryGateway as GatewayAbstraction,
    type ICreateEntryGatewayParams
} from "./abstractions.js";

interface CreateEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

class CreateEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, data, options }: ICreateEntryGatewayParams) {
        const mutation = createCreateMutation(model);

        const response = await this.client.execute<CreateEntryResponse>({
            query: mutation,
            variables: { data, options }
        });

        const { data: entry, error } = response.content;

        if (!entry) {
            throw new Error(error?.message || "Could not create entry");
        }

        return entry;
    }
}

export const CreateEntryGateway = GatewayAbstraction.createImplementation({
    implementation: CreateEntryGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
