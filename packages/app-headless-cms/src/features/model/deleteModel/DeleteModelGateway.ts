import { GraphQLOperationError } from "@webiny/app/errors/index.js";
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
            // The typed error keeps the server's code and data, so a refusal can be shown as such.
            throw new GraphQLOperationError({
                message: error?.message || "Could not delete content model",
                code: error?.code,
                data: error?.data
            });
        }

        return result;
    }
}

export const DeleteModelGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteModelGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
