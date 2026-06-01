import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsContentEntryRevision, CmsErrorResponse } from "~/types.js";
import { createRevisionsQuery } from "@webiny/app-headless-cms-common";
import {
    ListRevisionsGateway as GatewayAbstraction,
    type IListRevisionsParams
} from "./abstractions.js";

interface ListRevisionsResponse {
    revisions: {
        data: CmsContentEntryRevision[] | null;
        error: CmsErrorResponse | null;
    };
}

class ListRevisionsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ model, entryId }: IListRevisionsParams) {
        const query = createRevisionsQuery(model);

        const response = await this.client.execute<ListRevisionsResponse>({
            query,
            variables: { id: entryId }
        });

        const { data, error } = response.revisions;

        if (!data) {
            throw new Error(error?.message || "Could not list revisions");
        }

        return data;
    }
}

export const ListRevisionsGateway = GatewayAbstraction.createImplementation({
    implementation: ListRevisionsGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
