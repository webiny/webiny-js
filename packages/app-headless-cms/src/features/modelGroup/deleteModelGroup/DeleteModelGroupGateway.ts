import gql from "graphql-tag";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import { DeleteModelGroupGateway as GatewayAbstraction } from "./abstractions.js";

export interface DeleteModelGroupResponse {
    deleteContentModelGroup: {
        data: boolean | null;
        error: CmsErrorResponse | null;
    };
}

export interface DeleteModelGroupVariables {
    id: string;
}

const DELETE_CONTENT_MODEL_GROUP = gql`
    mutation CmsDeleteContentModelGroup($id: ID!) {
        deleteContentModelGroup(id: $id) {
            data
            error {
                message
                code
                data
            }
        }
    }
`;

class DeleteModelGroupGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(id: string) {
        const response = await this.client.execute<
            DeleteModelGroupResponse,
            DeleteModelGroupVariables
        >({
            query: DELETE_CONTENT_MODEL_GROUP,
            variables: { id }
        });

        const { data, error } = response.deleteContentModelGroup;

        if (!data) {
            throw new Error(error?.message || "Could not delete model group");
        }
    }
}

export const DeleteModelGroupGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteModelGroupGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
