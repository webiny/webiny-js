import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import type { DeleteModelResult } from "./abstractions.js";
import { DeleteModelGateway as GatewayAbstraction } from "./abstractions.js";

interface DeleteModelResponse {
    fullyDeleteModel: {
        data: DeleteModelResult | null;
        error: CmsErrorResponse | null;
    };
}

interface DeleteModelVariables {
    modelId: string;
    confirmation: string;
}

const FULLY_DELETE_CONTENT_MODEL = /* GraphQL */ `
    mutation CmsFullyDeleteContentModel($modelId: ID!, $confirmation: String!) {
        fullyDeleteModel(modelId: $modelId, confirmation: $confirmation) {
            data {
                id
                status
                deleted
                total
            }
            error {
                message
                code
                data
            }
        }
    }
`;

class DeleteModelGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(modelId: string, confirmation: string) {
        const response = await this.client.execute<DeleteModelResponse, DeleteModelVariables>({
            query: FULLY_DELETE_CONTENT_MODEL,
            variables: { modelId, confirmation }
        });

        const { data: result, error } = response.fullyDeleteModel;

        if (!result) {
            throw new Error(error?.message || "Could not delete content model");
        }

        return result;
    }
}

export const DeleteModelGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteModelGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
