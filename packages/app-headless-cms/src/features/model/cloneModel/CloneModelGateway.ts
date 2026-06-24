import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsModel, CmsErrorResponse } from "~/types.js";
import type { CloneModelParams } from "./abstractions.js";
import { CloneModelGateway as GatewayAbstraction } from "./abstractions.js";

interface CloneModelResponse {
    createContentModelFrom: {
        data: CmsModel | null;
        error: CmsErrorResponse | null;
    };
}

interface CloneModelVariables {
    modelId: string;
    data: CloneModelParams["data"];
}

const CREATE_CONTENT_MODEL_FROM = /* GraphQL */ `
    mutation CmsCreateContentModelFrom($modelId: ID!, $data: CmsContentModelCreateFromInput!) {
        createContentModelFrom(modelId: $modelId, data: $data) {
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

class CloneModelGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(params: CloneModelParams) {
        const response = await this.client.execute<CloneModelResponse, CloneModelVariables>({
            query: CREATE_CONTENT_MODEL_FROM,
            variables: { modelId: params.modelId, data: params.data }
        });

        const { data: result, error } = response.createContentModelFrom;

        if (!result) {
            throw new Error(error?.message || "Could not clone content model");
        }

        return result;
    }
}

export const CloneModelGateway = GatewayAbstraction.createImplementation({
    implementation: CloneModelGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
