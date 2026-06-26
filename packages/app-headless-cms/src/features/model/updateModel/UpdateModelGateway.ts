import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsModel, CmsErrorResponse } from "~/types.js";
import type { UpdateModelParams } from "./abstractions.js";
import { UpdateModelGateway as GatewayAbstraction } from "./abstractions.js";

interface UpdateModelResponse {
    updateContentModel: {
        data: CmsModel | null;
        error: CmsErrorResponse | null;
    };
}

interface UpdateModelVariables {
    modelId: string;
    data: UpdateModelParams["data"];
}

const UPDATE_CONTENT_MODEL = /* GraphQL */ `
    mutation CmsUpdateContentModel($modelId: ID!, $data: CmsContentModelUpdateInput!) {
        updateContentModel(modelId: $modelId, data: $data) {
            data {
                description
                modelId
                singularApiName
                pluralApiName
                name
                icon
                savedOn
                plugin
                tags
                fields {
                    id
                    type
                    fieldId
                }
                group
                createdBy {
                    id
                    displayName
                    type
                }
                isBeingDeleted
            }
            error {
                message
                code
                data
            }
        }
    }
`;

class UpdateModelGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(params: UpdateModelParams) {
        const response = await this.client.execute<UpdateModelResponse, UpdateModelVariables>({
            query: UPDATE_CONTENT_MODEL,
            variables: { modelId: params.modelId, data: params.data }
        });

        const { data: result, error } = response.updateContentModel;

        if (!result) {
            throw new Error(error?.message || "Could not update content model");
        }

        return result;
    }
}

export const UpdateModelGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateModelGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
