import { MainGraphQLClient } from "@webiny/app/exports/admin.js";
import {
    ListAdminComponentsGateway as GatewayAbstraction,
    type AdminComponent
} from "./abstractions.js";

const LIST_ADMIN_COMPONENTS = /* GraphQL */ `
    query ListAdminComponents($kind: String!) {
        aiPowerUps {
            listAdminComponents(kind: $kind) {
                id
                kind
                name
                label
                description
                fieldType
                appliesTo
                source
            }
        }
    }
`;

type ListAdminComponentsResponse = {
    aiPowerUps: {
        listAdminComponents: AdminComponent[];
    } | null;
};

class ListAdminComponentsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(kind: string): Promise<AdminComponent[]> {
        const response = await this.client.execute<ListAdminComponentsResponse>({
            query: LIST_ADMIN_COMPONENTS,
            variables: { kind }
        });

        return response.aiPowerUps?.listAdminComponents ?? [];
    }
}

export const ListAdminComponentsGateway = GatewayAbstraction.createImplementation({
    implementation: ListAdminComponentsGatewayImpl,
    dependencies: [MainGraphQLClient]
});
