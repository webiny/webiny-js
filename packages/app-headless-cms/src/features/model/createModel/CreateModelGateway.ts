import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsModel, CmsErrorResponse } from "~/types.js";
import type { CreateModelParams } from "./abstractions.js";
import { CreateModelGateway as GatewayAbstraction } from "./abstractions.js";

interface CreateModelResponse {
    createContentModel: {
        data: CmsModel | null;
        error: CmsErrorResponse | null;
    };
}

interface CreateModelVariables {
    data: CreateModelParams;
}

const CREATE_CONTENT_MODEL = /* GraphQL */ `
    mutation CmsCreateContentModel($data: CmsContentModelCreateInput!) {
        createContentModel(data: $data) {
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

class CreateModelGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(data: CreateModelParams) {
        const response = await this.client.execute<CreateModelResponse, CreateModelVariables>({
            query: CREATE_CONTENT_MODEL,
            variables: { data }
        });

        const { data: result, error } = response.createContentModel;

        if (!result) {
            throw new Error(error?.message || "Could not create content model");
        }

        return result;
    }
}

export const CreateModelGateway = GatewayAbstraction.createImplementation({
    implementation: CreateModelGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
