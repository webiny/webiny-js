import gql from "graphql-tag";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import type { ModelGroupDto } from "../listModelGroups/abstractions.js";
import type { UpdateModelGroupParams } from "./abstractions.js";
import { UpdateModelGroupGateway as GatewayAbstraction } from "./abstractions.js";

export interface UpdateModelGroupResponse {
    contentModelGroup: {
        data: ModelGroupDto | null;
        error: CmsErrorResponse | null;
    };
}

export interface UpdateModelGroupVariables {
    id: string;
    data: Omit<UpdateModelGroupParams, "id">;
}

const UPDATE_CONTENT_MODEL_GROUP = gql`
    mutation CmsUpdateContentModelGroup($id: ID!, $data: CmsContentModelGroupInput!) {
        contentModelGroup: updateContentModelGroup(id: $id, data: $data) {
            data {
                id
                name
                slug
                description
                icon
                createdOn
                plugin
                createdBy {
                    id
                    displayName
                    type
                }
            }
            error {
                message
                code
                data
            }
        }
    }
`;

class UpdateModelGroupGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(id: string, data: Omit<UpdateModelGroupParams, "id">) {
        const response = await this.client.execute<
            UpdateModelGroupResponse,
            UpdateModelGroupVariables
        >({
            query: UPDATE_CONTENT_MODEL_GROUP,
            variables: { id, data }
        });

        const { data: result, error } = response.contentModelGroup;

        if (!result) {
            throw new Error(error?.message || "Could not update model group");
        }

        return result;
    }
}

export const UpdateModelGroupGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateModelGroupGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
