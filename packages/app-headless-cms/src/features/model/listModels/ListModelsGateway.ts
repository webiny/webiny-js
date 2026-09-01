import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsModel, CmsErrorResponse } from "~/types.js";
import { LIST_CONTENT_MODELS } from "~/admin/viewsGraphql.js";
import { ListModelsGateway as GatewayAbstraction } from "./abstractions.js";

interface ListModelsResponse {
    listContentModels: {
        data: CmsModel[] | null;
        error: CmsErrorResponse | null;
    };
}

class ListModelsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute() {
        const response = await this.client.execute<ListModelsResponse>({
            query: LIST_CONTENT_MODELS
        });

        const { data, error } = response.listContentModels;

        if (!data) {
            throw new Error(error?.message || "Could not fetch models");
        }

        return data;
    }
}

export const ListModelsGateway = GatewayAbstraction.createImplementation({
    implementation: ListModelsGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
