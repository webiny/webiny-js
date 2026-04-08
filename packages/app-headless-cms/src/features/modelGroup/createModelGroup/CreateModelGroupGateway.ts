import gql from "graphql-tag";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import type { ModelGroupDto } from "../listModelGroups/abstractions.js";
import type { CreateModelGroupParams } from "./abstractions.js";
import { CreateModelGroupGateway as GatewayAbstraction } from "./abstractions.js";

export interface CreateModelGroupResponse {
    contentModelGroup: {
        data: ModelGroupDto | null;
        error: CmsErrorResponse | null;
    };
}

export interface CreateModelGroupVariables {
    data: CreateModelGroupParams;
}

const CREATE_CONTENT_MODEL_GROUP = gql`
    mutation CmsCreateContentModelGroup($data: CmsContentModelGroupInput!) {
        contentModelGroup: createContentModelGroup(data: $data) {
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
                contentModels {
                    modelId
                    name
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

class CreateModelGroupGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(data: CreateModelGroupParams) {
        const response = await this.client.execute<
            CreateModelGroupResponse,
            CreateModelGroupVariables
        >({
            query: CREATE_CONTENT_MODEL_GROUP,
            variables: { data }
        });

        const { data: result, error } = response.contentModelGroup;

        if (!result) {
            throw new Error(error?.message || "Could not create model group");
        }

        return result;
    }
}

export const CreateModelGroupGateway = GatewayAbstraction.createImplementation({
    implementation: CreateModelGroupGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
