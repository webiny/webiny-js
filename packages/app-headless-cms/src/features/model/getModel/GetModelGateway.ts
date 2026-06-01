import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsModel, CmsErrorResponse } from "~/types.js";
import { GET_CONTENT_MODEL } from "~/admin/graphql/contentModels.js";
import { GetModelGateway as GatewayAbstraction, type IGetModelParams } from "./abstractions.js";

interface GetModelResponse {
    getContentModel: {
        data: CmsModel | null;
        error: CmsErrorResponse | null;
    };
}

class GetModelGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute({ modelId }: IGetModelParams) {
        const response = await this.client.execute<GetModelResponse>({
            query: GET_CONTENT_MODEL,
            variables: { modelId }
        });

        const { data, error } = response.getContentModel;

        if (!data) {
            throw new Error(error?.message || `Could not fetch model "${modelId}"`);
        }

        return data;
    }
}

export const GetModelGateway = GatewayAbstraction.createImplementation({
    implementation: GetModelGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
