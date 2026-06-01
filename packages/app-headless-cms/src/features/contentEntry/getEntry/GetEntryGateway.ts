import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntry, CmsErrorResponse } from "~/types.js";
import { createReadQuery } from "@webiny/app-headless-cms-common";
import { GetEntryGateway as GatewayAbstraction, type IGetEntryParams } from "./abstractions.js";

interface GetEntryResponse {
    content: {
        data: CmsContentEntry | null;
        error: CmsErrorResponse | null;
    };
}

class GetEntryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, id }: IGetEntryParams) {
        const query = createReadQuery(model);
        const isRevisionId = id.includes("#");

        const response = await this.client.execute<GetEntryResponse>({
            query,
            variables: isRevisionId ? { revision: id } : { entryId: id }
        });

        const { data, error } = response.content;

        if (!data) {
            throw new Error(error?.message || "Could not fetch entry");
        }

        return data;
    }
}

export const GetEntryGateway = GatewayAbstraction.createImplementation({
    implementation: GetEntryGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
