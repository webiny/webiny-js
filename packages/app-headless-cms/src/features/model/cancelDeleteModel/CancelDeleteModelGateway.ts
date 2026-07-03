import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import { CancelDeleteModelGateway as GatewayAbstraction } from "./abstractions.js";

interface CancelDeleteModelResponse {
    cancelFullyDeleteModel: {
        data: { id: string; status: string } | null;
        error: CmsErrorResponse | null;
    };
}

interface CancelDeleteModelVariables {
    modelId: string;
}

const CANCEL_DELETE_CONTENT_MODEL = /* GraphQL */ `
    mutation CmsCancelDeleteContentModel($modelId: ID!) {
        cancelFullyDeleteModel(modelId: $modelId) {
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

class CancelDeleteModelGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(modelId: string) {
        const response = await this.client.execute<
            CancelDeleteModelResponse,
            CancelDeleteModelVariables
        >({
            query: CANCEL_DELETE_CONTENT_MODEL,
            variables: { modelId }
        });

        const { error } = response.cancelFullyDeleteModel;

        if (error) {
            throw new Error(error.message);
        }
    }
}

export const CancelDeleteModelGateway = GatewayAbstraction.createImplementation({
    implementation: CancelDeleteModelGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
