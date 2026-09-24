import { MainGraphQLClient } from "@webiny/app/exports/admin.js";
import { ListCapabilitiesGateway as GatewayAbstraction } from "./abstractions.js";
import type { AiCapability } from "./abstractions.js";

const LIST_CAPABILITIES = /* GraphQL */ `
    query ListAiCapabilities {
        aiPowerUps {
            listCapabilities {
                id
                label
                description
                defaultRole
            }
        }
    }
`;

type ListCapabilitiesResponse = {
    aiPowerUps: {
        listCapabilities: AiCapability[];
    };
};

class ListCapabilitiesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private client: MainGraphQLClient.Interface) {}

    async execute(): Promise<AiCapability[]> {
        const response = await this.client.execute<ListCapabilitiesResponse>({
            query: LIST_CAPABILITIES
        });

        return response.aiPowerUps.listCapabilities ?? [];
    }
}

export const ListCapabilitiesGateway = GatewayAbstraction.createImplementation({
    implementation: ListCapabilitiesGatewayImpl,
    dependencies: [MainGraphQLClient]
});
