import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse } from "~/types.js";
import { createCreateFromMutation } from "@webiny/app-headless-cms-common";
import {
    CreateRevisionFromGateway as GatewayAbstraction,
    type ICreateRevisionFromParams
} from "./abstractions.js";

interface CreateRevisionFromResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

class CreateRevisionFromGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, revisionId, data, options }: ICreateRevisionFromParams) {
        const mutation = createCreateFromMutation(model);

        const response = await this.client.execute<CreateRevisionFromResponse>({
            query: mutation,
            variables: { revision: revisionId, data, options }
        });

        const { data: entry, error } = response.content;

        if (!entry) {
            throw new Error(error?.message || "Could not create revision");
        }

        return entry;
    }
}

export const CreateRevisionFromGateway = GatewayAbstraction.createImplementation({
    implementation: CreateRevisionFromGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
