import gql from "graphql-tag";
import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import type { ModelGroupDto } from "../listModelGroups/abstractions.js";
import { GetModelGroupGateway as GatewayAbstraction } from "./abstractions.js";

export interface GetModelGroupResponse {
    contentModelGroup: {
        data: ModelGroupDto | null;
        error: CmsErrorResponse | null;
    };
}

export interface GetModelGroupVariables {
    id: string;
}

const GET_CONTENT_MODEL_GROUP = gql`
    query CmsGetContentModelGroup($id: ID!) {
        contentModelGroup: getContentModelGroup(id: $id) {
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

class GetModelGroupGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute(id: string) {
        const response = await this.client.execute<GetModelGroupResponse, GetModelGroupVariables>({
            query: GET_CONTENT_MODEL_GROUP,
            variables: { id }
        });

        const { data, error } = response.contentModelGroup;

        if (!data) {
            throw new Error(error?.message || `Could not fetch model group with id: ${id}`);
        }

        return data;
    }
}

export const GetModelGroupGateway = GatewayAbstraction.createImplementation({
    implementation: GetModelGroupGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
