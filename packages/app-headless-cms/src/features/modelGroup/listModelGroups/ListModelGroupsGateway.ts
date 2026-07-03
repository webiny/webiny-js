import { CmsGraphQLClient } from "~/features/graphQLClient/abstractions.js";
import type { CmsErrorResponse } from "~/types.js";
import type { ModelGroupDto } from "./abstractions.js";
import { ListModelGroupsGateway as GatewayAbstraction } from "./abstractions.js";

export interface ListModelGroupsResponse {
    listContentModelGroups: {
        data: ModelGroupDto[] | null;
        error: CmsErrorResponse | null;
    };
}

const LIST_CONTENT_MODEL_GROUPS = /* GraphQL */ `
    query CmsListContentModelGroups {
        listContentModelGroups {
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
                    icon
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

class ListModelGroupsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: CmsGraphQLClient.Interface) {}

    async execute() {
        const response = await this.client.execute<ListModelGroupsResponse>({
            query: LIST_CONTENT_MODEL_GROUPS
        });

        const { data, error } = response.listContentModelGroups;

        if (!data) {
            throw new Error(error?.message || "Could not fetch model groups");
        }

        return data;
    }
}

export const ListModelGroupsGateway = GatewayAbstraction.createImplementation({
    implementation: ListModelGroupsGatewayImpl,
    dependencies: [CmsGraphQLClient]
});
