import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse } from "~/types.js";
import { createReadSingletonQuery } from "@webiny/app-headless-cms-common";
import {
    GetSingletonEntryGateway as GatewayAbstraction,
    type IGetSingletonEntryParams
} from "./abstractions.js";

interface GetSingletonEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

class GetSingletonEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model }: IGetSingletonEntryParams) {
        const query = createReadSingletonQuery(model);

        const response = await this.client.execute<GetSingletonEntryResponse>({
            query
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not fetch singleton entry");
        }

        return data;
    }
}

export const GetSingletonEntryGateway = GatewayAbstraction.createImplementation({
    implementation: GetSingletonEntryGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
